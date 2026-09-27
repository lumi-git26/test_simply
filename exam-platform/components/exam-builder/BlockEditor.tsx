"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Block, newQuestionBlock, newReadingBlock, newInstructionBlock, shuffleOrderItems,
} from "@/lib/blocks";
import { Question, Passage } from "@/lib/types";
import { AddBlockMenu } from "@/components/exam-builder/AddBlockMenu";
import { QuestionBlockCard } from "@/components/exam-builder/QuestionBlockCard";
import { ReadingBlockCard } from "@/components/exam-builder/ReadingBlockCard";
import { InstructionBlockCard } from "@/components/exam-builder/InstructionBlockCard";
import { Button } from "@/components/ui/Button";

let uid = 0;
const nextId = () => `blk_${Date.now()}_${uid++}`;

// Convert existing DB questions/passages into an initial block list, so
// re-opening the editor shows what's already saved.
function fromExisting(questions: Question[], passages: Passage[]): Block[] {
  const passageBlockIdByDbId = new Map<string, string>();
  const blocks: Block[] = [];
  let lastInstruction = "";
  let lastPassageDbId: string | null = null;

  for (const q of questions) {
    if (q.passage_id && q.passage_id !== lastPassageDbId) {
      const passage = passages.find((p) => p.id === q.passage_id);
      const blockId = nextId();
      passageBlockIdByDbId.set(q.passage_id, blockId);
      blocks.push({
        id: blockId, type: "reading", dbId: q.passage_id,
        data: { title: passage?.title ?? "", body: passage?.body ?? "" },
      });
      lastPassageDbId = q.passage_id;
    }
    if (q.instruction && q.instruction !== lastInstruction) {
      blocks.push({ id: nextId(), type: "instruction", data: { text: q.instruction } });
      lastInstruction = q.instruction;
    }
    if (!q.instruction) lastInstruction = "";

    const isOrder = q.question_type === "order";
    const isMC = q.question_type === "multiple_choice";
    blocks.push({
      id: nextId(),
      type: "question",
      dbId: q.id,
      passageBlockId: q.passage_id ? passageBlockIdByDbId.get(q.passage_id) ?? null : null,
      data: {
        question_type: q.question_type,
        question_text: q.question_text,
        context: q.context ?? "",
        options: isMC ? (q.options as any) : { A: "", B: "", C: "", D: "" },
        correct_letter: isMC ? (q.correct_answer as any) : "A",
        fill_answer: q.question_type === "fill_blank" ? q.correct_answer : "",
        order_items: isOrder && Array.isArray(q.options)
          ? reconstructOrderItems(q.options as unknown as string[], q.correct_answer)
          : ["", ""],
        writing_answers:
          q.question_type === "writing_rewrite" || q.question_type === "writing_rearrange"
            ? q.correct_answer
            : "",
        points: q.points,
        explanation: q.explanation ?? "",
      },
    });
  }
  return blocks;
}

function reconstructOrderItems(shuffled: string[], correctAnswer: string): string[] {
  // correct_answer[k] = position in `shuffled` of the item that belongs at
  // original position k — invert that to rebuild the original correct order.
  const positions = correctAnswer.split(",").map(Number);
  const result: string[] = new Array(shuffled.length);
  positions.forEach((shuffledPos, originalPos) => { result[originalPos] = shuffled[shuffledPos]; });
  return result;
}

export function BlockEditor({
  examId,
  initialQuestions,
  initialPassages,
}: {
  examId: string;
  initialQuestions: Question[];
  initialPassages: Passage[];
}) {
  const [blocks, setBlocks] = useState<Block[]>(() => fromExisting(initialQuestions, initialPassages));
  const [removedQuestionIds, setRemovedQuestionIds] = useState<string[]>([]);
  const [removedPassageIds, setRemovedPassageIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  const readingOptions = useMemo(
    () => blocks
      .filter((b): b is Extract<Block, { type: "reading" }> => b.type === "reading")
      .map((b) => ({ id: b.id, label: b.data.title || b.data.body.slice(0, 30) })),
    [blocks]
  );

  function addBlock(type: "question" | "reading" | "instruction") {
    const block = type === "question" ? newQuestionBlock(nextId())
      : type === "reading" ? newReadingBlock(nextId())
      : newInstructionBlock(nextId());
    setBlocks((b) => [...b, block]);
  }

  function updateBlock(id: string, updater: (b: Block) => Block) {
    setBlocks((prev) => prev.map((b) => (b.id === id ? updater(b) : b)));
  }

  function deleteBlock(id: string) {
    const block = blocks.find((b) => b.id === id);
    if (block?.type === "question" && block.dbId) setRemovedQuestionIds((r) => [...r, block.dbId!]);
    if (block?.type === "reading" && block.dbId) setRemovedPassageIds((r) => [...r, block.dbId!]);
    setBlocks((prev) => prev.filter((b) => b.id !== id));
  }

  function move(id: string, dir: -1 | 1) {
    setBlocks((prev) => {
      const i = prev.findIndex((b) => b.id === id);
      const j = i + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  async function save() {
    setSaving(true);

    // 1. sync reading blocks -> passages, remember dbId for new ones
    const passageDbIdByBlockId = new Map<string, string>();
    for (const b of blocks) {
      if (b.type !== "reading") continue;
      if (b.dbId) {
        await fetch(`/api/exams/${examId}/passages/${b.dbId}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: b.data.title, body: b.data.body }),
        });
        passageDbIdByBlockId.set(b.id, b.dbId);
      } else {
        const res = await fetch(`/api/exams/${examId}/passages`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: b.data.title, body: b.data.body }),
        });
        const created = await res.json();
        passageDbIdByBlockId.set(b.id, created.id);
      }
    }

    // 2. delete removed passages/questions
    for (const id of removedPassageIds) {
      await fetch(`/api/exams/${examId}/passages/${id}`, { method: "DELETE" });
    }
    for (const id of removedQuestionIds) {
      await fetch(`/api/exams/${examId}/questions/${id}`, { method: "DELETE" });
    }

    // 3. sync question blocks, computing instruction (nearest preceding
    // Instruction block) and part/passage_id (from the chosen Reading block)
    let currentInstruction = "";
    let orderIndex = 0;
    const updatedBlocks = [...blocks];

    for (let i = 0; i < updatedBlocks.length; i++) {
      const b = updatedBlocks[i];
      if (b.type === "instruction") { currentInstruction = b.data.text; continue; }
      if (b.type !== "question") continue;

      const passageDbId = b.passageBlockId ? passageDbIdByBlockId.get(b.passageBlockId) ?? null : null;
      const { question_type, question_text, context, points, explanation } = b.data;

      let options: any = null;
      let correct_answer = "";
      if (question_type === "multiple_choice") {
        options = b.data.options;
        correct_answer = b.data.correct_letter;
      } else if (question_type === "fill_blank") {
        correct_answer = b.data.fill_answer;
      } else if (question_type === "order") {
        const shuffled = shuffleOrderItems(b.data.order_items.filter((s) => s.trim()));
        options = shuffled.options;
        correct_answer = shuffled.correct_answer;
      } else {
        correct_answer = b.data.writing_answers;
      }

      const payload = {
        passage_id: passageDbId,
        part: passageDbId ? 2 : 1,
        order_index: orderIndex++,
        question_type, question_text, context: context || null,
        options, correct_answer, points, explanation: explanation || null,
        instruction: currentInstruction || null,
      };

      if (b.dbId) {
        await fetch(`/api/exams/${examId}/questions/${b.dbId}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        const res = await fetch(`/api/exams/${examId}/questions`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const created = await res.json();
        updatedBlocks[i] = { ...b, dbId: created.id };
      }
    }

    setBlocks(updatedBlocks);
    setRemovedQuestionIds([]);
    setRemovedPassageIds([]);
    setSaving(false);
    setSavedAt(new Date());
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold">Nội dung bài kiểm tra</h2>
        <div className="flex items-center gap-3">
          {savedAt && <span className="text-xs text-ink-soft">Đã lưu {savedAt.toLocaleTimeString()}</span>}
          <Button onClick={save} disabled={saving}>{saving ? "Đang lưu…" : "Lưu"}</Button>
        </div>
      </div>

      <div className="space-y-2">
        {blocks.map((b, i) => (
          <div key={b.id} className="group/row relative">
            <div className="absolute -left-8 top-2 hidden flex-col gap-1 group-hover/row:flex">
              <button onClick={() => move(b.id, -1)} disabled={i === 0} className="text-ink-soft disabled:opacity-20">↑</button>
              <button onClick={() => move(b.id, 1)} disabled={i === blocks.length - 1} className="text-ink-soft disabled:opacity-20">↓</button>
            </div>

            {b.type === "instruction" && (
              <InstructionBlockCard
                text={b.data.text}
                onChange={(text) => updateBlock(b.id, (blk) => ({ ...blk, data: { text } }) as Block)}
                onDelete={() => deleteBlock(b.id)}
              />
            )}
            {b.type === "reading" && (
              <ReadingBlockCard
                data={b.data}
                onChange={(data) => updateBlock(b.id, (blk) => ({ ...blk, data }) as Block)}
                onDelete={() => deleteBlock(b.id)}
              />
            )}
            {b.type === "question" && (
              <QuestionBlockCard
                index={blocks.slice(0, i + 1).filter((x) => x.type === "question").length - 1}
                data={b.data}
                readingOptions={readingOptions}
                passageBlockId={b.passageBlockId}
                onChangePassage={(id) => updateBlock(b.id, (blk) =>
                  blk.type === "question" ? { ...blk, passageBlockId: id } : blk
                )}
                onChange={(data) => updateBlock(b.id, (blk) =>
                  blk.type === "question" ? { ...blk, data } : blk
                )}
                onDelete={() => deleteBlock(b.id)}
              />
            )}
          </div>
        ))}
      </div>

      <AddBlockMenu onAdd={addBlock} />
    </div>
  );
}
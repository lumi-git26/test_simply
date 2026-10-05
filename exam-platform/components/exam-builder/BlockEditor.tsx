"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Block, newQuestionBlock, newReadingBlock, newInstructionBlock, shuffleOrderItems,
} from "@/lib/blocks";
import { Question, Passage } from "@/lib/types";
import { AddBlockMenu } from "@/components/exam-builder/AddBlockMenu";
import { QuestionBlockCard } from "@/components/exam-builder/QuestionBlockCard";
import { ReadingBlockCard } from "@/components/exam-builder/ReadingBlockCard";
import { InstructionBlockCard } from "@/components/exam-builder/InstructionBlockCard";
import { PreviewModal } from "@/components/exam-builder/PreviewModal";
import { ExcelImport } from "@/components/exam-builder/ExcelImport";
import { PdfImport } from "@/components/exam-builder/PdfImport";

let uid = 0;
const nextId = () => `blk_${Date.now()}_${uid++}`;

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
  const positions = correctAnswer.split(",").map(Number);
  const result: string[] = new Array(shuffled.length);
  positions.forEach((shuffledPos, originalPos) => { result[originalPos] = shuffled[shuffledPos]; });
  return result;
}

const TYPE_SHORT: Record<string, string> = {
  multiple_choice: "MC",
  fill_blank: "Blank",
  order: "Order",
  writing_rewrite: "Writing",
  writing_rearrange: "Writing",
};

export function BlockEditor({
  examId,
  initialQuestions,
  initialPassages,
  externalShowPreview,
  onClosePreview,
  externalSaveTrigger,
  onSavingChange,
  onSaved,
}: {
  examId: string;
  initialQuestions: Question[];
  initialPassages: Passage[];
  externalShowPreview?: boolean;
  onClosePreview?: () => void;
  externalSaveTrigger?: number;
  onSavingChange?: (saving: boolean) => void;
  onSaved?: () => void;
}) {
  const [blocks, setBlocks] = useState<Block[]>(() => fromExisting(initialQuestions, initialPassages));
  const [removedQuestionIds, setRemovedQuestionIds] = useState<string[]>([]);
  const [removedPassageIds, setRemovedPassageIds] = useState<string[]>([]);
  const blockRefs = useRef<Record<string, HTMLDivElement | null>>({});

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
    requestAnimationFrame(() => {
      blockRefs.current[block.id]?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
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
    onSavingChange?.(true);

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

    for (const id of removedPassageIds) {
      await fetch(`/api/exams/${examId}/passages/${id}`, { method: "DELETE" });
    }
    for (const id of removedQuestionIds) {
      await fetch(`/api/exams/${examId}/questions/${id}`, { method: "DELETE" });
    }

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
        const shuffled = shuffleOrderItems(b.data.order_items.filter((s: string) => s.trim()));
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
    onSavingChange?.(false);
    onSaved?.();
  }

  // trigger save from the top bar's Save button
  useEffect(() => {
    if (externalSaveTrigger && externalSaveTrigger > 0) save();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalSaveTrigger]);

  function refreshAfterImport() {
    window.location.reload();
  }

  let questionCounter = 0;

  return (
    <div className="flex">
      {/* ---------- Sidebar ---------- */}
      <aside className="sticky top-14 h-[calc(100vh-3.5rem)] w-64 shrink-0 overflow-y-auto border-r border-border px-3 py-4">
        <details className="mb-4 rounded-lg border border-border p-2 text-sm">
          <summary className="cursor-pointer select-none text-ink-soft">Import</summary>
          <div className="mt-2 space-y-2">
            <ExcelImport examId={examId} onImported={refreshAfterImport} />
            <PdfImport examId={examId} onImported={refreshAfterImport} />
          </div>
        </details>

        <div className="space-y-1">
          {blocks.map((b) => {
            if (b.type === "question") {
              questionCounter++;
              const label = b.data.question_text || b.data.context || "(empty)";
              return (
                <button
                  key={b.id}
                  onClick={() => blockRefs.current[b.id]?.scrollIntoView({ behavior: "smooth", block: "center" })}
                  className="flex w-full items-start gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-paper-dark"
                >
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink text-[10px] text-paper">
                    {questionCounter}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">{label}</span>
                    <span className="text-xs text-ink-soft">{TYPE_SHORT[b.data.question_type]}</span>
                  </span>
                </button>
              );
            }
            if (b.type === "reading") {
              return (
                <button
                  key={b.id}
                  onClick={() => blockRefs.current[b.id]?.scrollIntoView({ behavior: "smooth", block: "center" })}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-ink-soft hover:bg-paper-dark"
                >
                  <span>▤</span>
                  <span className="truncate">{b.data.title || "Reading"}</span>
                </button>
              );
            }
            return (
              <button
                key={b.id}
                onClick={() => blockRefs.current[b.id]?.scrollIntoView({ behavior: "smooth", block: "center" })}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-ink-soft hover:bg-paper-dark"
              >
                <span>#</span>
                <span className="truncate">{b.data.text || "Instruction"}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-2">
          <AddBlockMenu onAdd={addBlock} />
        </div>
      </aside>

      {/* ---------- Main content ---------- */}
      <main className="mx-auto max-w-2xl flex-1 px-6 py-8">
        <div className="space-y-3">
          {blocks.map((b, i) => {
            const common = { ref: (el: HTMLDivElement | null) => { blockRefs.current[b.id] = el; } };
            if (b.type === "instruction") {
              return (
                <div key={b.id} {...common}>
                  <InstructionBlockCard
                    text={b.data.text}
                    onChange={(text) => updateBlock(b.id, (blk) => ({ ...blk, data: { text } }) as Block)}
                    onDelete={() => deleteBlock(b.id)}
                  />
                </div>
              );
            }
            if (b.type === "reading") {
              return (
                <div key={b.id} {...common}>
                  <ReadingBlockCard
                    data={b.data}
                    onChange={(data) => updateBlock(b.id, (blk) => ({ ...blk, data }) as Block)}
                    onDelete={() => deleteBlock(b.id)}
                  />
                </div>
              );
            }
            const qIndex = blocks.slice(0, i + 1).filter((x) => x.type === "question").length - 1;
            return (
              <div key={b.id} {...common}>
                <QuestionBlockCard
                  index={qIndex}
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
              </div>
            );
          })}
        </div>
      </main>

      {externalShowPreview && <PreviewModal blocks={blocks} onClose={() => onClosePreview?.()} />}
    </div>
  );
}
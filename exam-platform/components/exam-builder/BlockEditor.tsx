"use client";

import { useEffect, useRef, useState } from "react";
import {
  ExamDraft, Item, PassagePart,
  newQuestionItem, newInstructionItem, newPassagePart, shuffleOrderItems,
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

type Target = { kind: "part1" } | { kind: "passage"; id: string };

const TYPE_SHORT: Record<string, string> = {
  multiple_choice: "MC",
  fill_blank: "Blank",
  order: "Order",
  writing_rewrite: "Writing",
  writing_rearrange: "Writing",
};

function reconstructOrderItems(shuffled: string[], correctAnswer: string): string[] {
  const positions = correctAnswer.split(",").map(Number);
  const result: string[] = new Array(shuffled.length);
  positions.forEach((shuffledPos, originalPos) => { result[originalPos] = shuffled[shuffledPos]; });
  return result;
}

function toItems(qs: Question[]): Item[] {
  const items: Item[] = [];
  let lastInstruction = "";
  for (const q of qs) {
    if (q.instruction && q.instruction !== lastInstruction) {
      items.push({ id: nextId(), type: "instruction", data: { text: q.instruction } });
    }
    lastInstruction = q.instruction ?? "";

    const isOrder = q.question_type === "order";
    const isMC = q.question_type === "multiple_choice";
    items.push({
      id: nextId(),
      type: "question",
      dbId: q.id,
      data: {
        question_type: q.question_type,
        question_text: q.question_text,
        context: q.context ?? "",
        options: isMC ? (q.options as any) : { A: "", B: "", C: "", D: "" },
        correct_letter: isMC ? (q.correct_answer as any) : "A",
        fill_answer: q.question_type === "fill_blank" ? q.correct_answer : "",
        order_items:
          isOrder && Array.isArray(q.options)
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
  return items;
}

// Part 1 = questions without a passage. Each passage becomes a Part 2.x,
// ordered by its first question (passages with no questions go last).
function fromExisting(questions: Question[], passages: Passage[]): ExamDraft {
  const sorted = [...questions].sort((a, b) => a.order_index - b.order_index);
  const known = new Set(passages.map((p) => p.id));
  const part1Qs = sorted.filter((q) => !q.passage_id || !known.has(q.passage_id));

  const order: string[] = [];
  for (const q of sorted) {
    if (q.passage_id && known.has(q.passage_id) && !order.includes(q.passage_id)) order.push(q.passage_id);
  }
  for (const p of passages) if (!order.includes(p.id)) order.push(p.id);

  const passageParts: PassagePart[] = order.map((pid) => {
    const p = passages.find((x) => x.id === pid)!;
    return {
      id: nextId(),
      dbId: p.id,
      title: p.title ?? "",
      body: p.body,
      items: toItems(sorted.filter((q) => q.passage_id === pid)),
    };
  });

  return { part1: toItems(part1Qs), passages: passageParts };
}

export function BlockEditor({
  examId,
  examTitle,
  timeLimitMinutes,
  initialQuestions,
  initialPassages,
  externalShowPreview,
  onClosePreview,
  externalSaveTrigger,
  onSavingChange,
  onSaved,
}: {
  examId: string;
  examTitle: string;
  timeLimitMinutes: number | null;
  initialQuestions: Question[];
  initialPassages: Passage[];
  externalShowPreview?: boolean;
  onClosePreview?: () => void;
  externalSaveTrigger?: number;
  onSavingChange?: (saving: boolean) => void;
  onSaved?: () => void;
}) {
  const [draft, setDraft] = useState<ExamDraft>(() => fromExisting(initialQuestions, initialPassages));
  const [removedQuestionIds, setRemovedQuestionIds] = useState<string[]>([]);
  const [removedPassageIds, setRemovedPassageIds] = useState<string[]>([]);
  const refs = useRef<Record<string, HTMLElement | null>>({});

  function jumpTo(id: string, block: ScrollLogicalPosition = "start") {
    refs.current[id]?.scrollIntoView({ behavior: "smooth", block });
  }

  // ---------- item operations (inside Part 1 or a Part 2.x) ----------
  function updateItems(target: Target, fn: (items: Item[]) => Item[]) {
    setDraft((d) =>
      target.kind === "part1"
        ? { ...d, part1: fn(d.part1) }
        : { ...d, passages: d.passages.map((p) => (p.id === target.id ? { ...p, items: fn(p.items) } : p)) }
    );
  }

  function addItem(target: Target, type: "question" | "instruction") {
    const item = type === "question" ? newQuestionItem(nextId()) : newInstructionItem(nextId());
    updateItems(target, (items) => [...items, item]);
    requestAnimationFrame(() => jumpTo(item.id, "center"));
  }

  function updateItem(target: Target, id: string, fn: (it: Item) => Item) {
    updateItems(target, (items) => items.map((it) => (it.id === id ? fn(it) : it)));
  }

  function deleteItem(target: Target, item: Item) {
    if (item.type === "question" && item.dbId) setRemovedQuestionIds((r) => [...r, item.dbId!]);
    updateItems(target, (items) => items.filter((it) => it.id !== item.id));
  }

  function moveItem(target: Target, id: string, dir: -1 | 1) {
    updateItems(target, (items) => {
      const i = items.findIndex((it) => it.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= items.length) return items;
      const next = [...items];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  // ---------- Part 2.x operations ----------
  function addPassage() {
    const p = newPassagePart(nextId());
    setDraft((d) => ({ ...d, passages: [...d.passages, p] }));
    requestAnimationFrame(() => jumpTo(p.id));
  }

  function updatePassage(id: string, patch: Partial<Pick<PassagePart, "title" | "body">>) {
    setDraft((d) => ({ ...d, passages: d.passages.map((p) => (p.id === id ? { ...p, ...patch } : p)) }));
  }

  function deletePassage(p: PassagePart) {
    const qCount = p.items.filter((it) => it.type === "question").length;
    if (qCount > 0 && !window.confirm(`Delete this reading part and its ${qCount} question(s)?`)) return;
    // questions of a deleted part are deleted with it (not left behind as Part 1)
    const qIds = p.items.flatMap((it) => (it.type === "question" && it.dbId ? [it.dbId] : []));
    setRemovedQuestionIds((r) => [...r, ...qIds]);
    if (p.dbId) setRemovedPassageIds((r) => [...r, p.dbId!]);
    setDraft((d) => ({ ...d, passages: d.passages.filter((x) => x.id !== p.id) }));
  }

  // ---------- save ----------
  async function save() {
    onSavingChange?.(true);

    for (const id of removedQuestionIds) {
      await fetch(`/api/exams/${examId}/questions/${id}`, { method: "DELETE" });
    }
    for (const id of removedPassageIds) {
      await fetch(`/api/exams/${examId}/passages/${id}`, { method: "DELETE" });
    }

    // passages first, so their db ids exist for the questions
    const savedPassages: PassagePart[] = [];
    for (const p of draft.passages) {
      if (p.dbId) {
        await fetch(`/api/exams/${examId}/passages/${p.dbId}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: p.title, body: p.body }),
        });
        savedPassages.push(p);
      } else {
        const res = await fetch(`/api/exams/${examId}/passages`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: p.title, body: p.body }),
        });
        const created = await res.json();
        savedPassages.push({ ...p, dbId: created.id });
      }
    }

    let orderIndex = 0; // keeps the global order: Part 1, then Part 2.1, 2.2, ...

    async function savePart(items: Item[], passageDbId: string | null): Promise<Item[]> {
      let currentInstruction = ""; // an instruction applies until the next one, never across parts
      const out = [...items];
      for (let i = 0; i < out.length; i++) {
        const it = out[i];
        if (it.type === "instruction") { currentInstruction = it.data.text; continue; }

        const { question_type, question_text, context, points, explanation } = it.data;
        let options: any = null;
        let correct_answer = "";
        if (question_type === "multiple_choice") {
          options = it.data.options;
          correct_answer = it.data.correct_letter;
        } else if (question_type === "fill_blank") {
          correct_answer = it.data.fill_answer;
        } else if (question_type === "order") {
          const shuffled = shuffleOrderItems(it.data.order_items.filter((s: string) => s.trim()));
          options = shuffled.options;
          correct_answer = shuffled.correct_answer;
        } else {
          correct_answer = it.data.writing_answers;
        }

        const payload = {
          passage_id: passageDbId,
          part: passageDbId ? 2 : 1,
          order_index: orderIndex++,
          question_type, question_text, context: context || null,
          options, correct_answer, points, explanation: explanation || null,
          instruction: currentInstruction || null,
        };

        if (it.dbId) {
          await fetch(`/api/exams/${examId}/questions/${it.dbId}`, {
            method: "PATCH", headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
        } else {
          const res = await fetch(`/api/exams/${examId}/questions`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          const created = await res.json();
          out[i] = { ...it, dbId: created.id };
        }
      }
      return out;
    }

    const newPart1 = await savePart(draft.part1, null);
    const newPassages: PassagePart[] = [];
    for (const p of savedPassages) {
      newPassages.push({ ...p, items: await savePart(p.items, p.dbId) });
    }

    setDraft({ part1: newPart1, passages: newPassages });
    setRemovedQuestionIds([]);
    setRemovedPassageIds([]);
    onSavingChange?.(false);
    onSaved?.();
  }

  useEffect(() => {
    if (externalSaveTrigger && externalSaveTrigger > 0) save();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalSaveTrigger]);

  function refreshAfterImport() {
    window.location.reload();
  }

  // ---------- rendering ----------
  function renderItems(target: Target, items: Item[]) {
    let q = -1;
    return items.map((it, i) => {
      if (it.type === "question") q++;
      const qIndex = q;
      return (
        <div
          key={it.id}
          ref={(el) => { refs.current[it.id] = el; }}
          className="group/row relative scroll-mt-20"
        >
          <div className="absolute -left-7 top-2 hidden flex-col gap-1 group-hover/row:flex">
            <button onClick={() => moveItem(target, it.id, -1)} disabled={i === 0} className="text-ink-soft disabled:opacity-20">↑</button>
            <button onClick={() => moveItem(target, it.id, 1)} disabled={i === items.length - 1} className="text-ink-soft disabled:opacity-20">↓</button>
          </div>

          {it.type === "instruction" ? (
            <InstructionBlockCard
              text={it.data.text}
              onChange={(text) =>
                updateItem(target, it.id, (cur) => (cur.type === "instruction" ? { ...cur, data: { text } } : cur))
              }
              onDelete={() => deleteItem(target, it)}
            />
          ) : (
            <QuestionBlockCard
              index={qIndex}
              data={it.data}
              onChange={(data) =>
                updateItem(target, it.id, (cur) => (cur.type === "question" ? { ...cur, data } : cur))
              }
              onDelete={() => deleteItem(target, it)}
            />
          )}
        </div>
      );
    });
  }

  const part1Target: Target = { kind: "part1" };

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

        <SidebarGroup
          label="Part 1"
          items={draft.part1}
          onJumpPart={() => jumpTo("part1")}
          onJumpItem={(id) => jumpTo(id, "center")}
        />
        {draft.passages.map((p, k) => (
          <SidebarGroup
            key={p.id}
            label={`Part 2.${k + 1}${p.title ? ` · ${p.title}` : ""}`}
            items={p.items}
            onJumpPart={() => jumpTo(p.id)}
            onJumpItem={(id) => jumpTo(id, "center")}
          />
        ))}

        <button
          onClick={addPassage}
          className="mt-2 w-full rounded-md border border-dashed border-border py-2 text-sm text-ink-soft hover:border-ink hover:text-ink"
        >
          + Add reading part
        </button>
      </aside>

      {/* ---------- Main ---------- */}
      <main className="mx-auto max-w-2xl flex-1 space-y-12 px-6 py-8">
        <section ref={(el) => { refs.current["part1"] = el; }} className="scroll-mt-20">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-soft">Part 1</h2>
          <div className="space-y-3">{renderItems(part1Target, draft.part1)}</div>
          <div className="mt-3">
            <AddBlockMenu onAdd={(t) => addItem(part1Target, t)} />
          </div>
        </section>

        {draft.passages.map((p, k) => {
          const target: Target = { kind: "passage", id: p.id };
          return (
            <section key={p.id} ref={(el) => { refs.current[p.id] = el; }} className="scroll-mt-20">
              <div className="mb-3">
                <ReadingBlockCard
                  label={`Part 2.${k + 1}`}
                  data={{ title: p.title, body: p.body }}
                  onChange={(data) => updatePassage(p.id, data)}
                  onDelete={() => deletePassage(p)}
                />
              </div>
              <div className="space-y-3">{renderItems(target, p.items)}</div>
              <div className="mt-3">
                <AddBlockMenu onAdd={(t) => addItem(target, t)} />
              </div>
            </section>
          );
        })}

        <button
          onClick={addPassage}
          className="w-full rounded-md border border-dashed border-border py-3 text-sm text-ink-soft hover:border-ink hover:text-ink"
        >
          + Add reading part
        </button>
      </main>

      {externalShowPreview && (
        <PreviewModal
          draft={draft}
          examTitle={examTitle}
          timeLimitMinutes={timeLimitMinutes}
          onClose={() => onClosePreview?.()}
        />
      )}
    </div>
  );
}

function SidebarGroup({
  label,
  items,
  onJumpPart,
  onJumpItem,
}: {
  label: string;
  items: Item[];
  onJumpPart: () => void;
  onJumpItem: (id: string) => void;
}) {
  let n = 0;
  return (
    <div className="mb-4">
      <button
        onClick={onJumpPart}
        className="mb-1 w-full truncate px-2 text-left text-xs font-semibold uppercase tracking-wide text-ink-soft hover:text-ink"
      >
        {label}
      </button>
      <div className="space-y-0.5">
        {items.map((it) => {
          if (it.type === "instruction") {
            return (
              <button
                key={it.id}
                onClick={() => onJumpItem(it.id)}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm text-ink-soft hover:bg-paper-dark"
              >
                <span>#</span>
                <span className="truncate">{it.data.text || "Instruction"}</span>
              </button>
            );
          }
          n++;
          return (
            <button
              key={it.id}
              onClick={() => onJumpItem(it.id)}
              className="flex w-full items-start gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-paper-dark"
            >
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink text-[10px] text-paper">
                {n}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate">{it.data.question_text || it.data.context || "(empty)"}</span>
                <span className="text-xs text-ink-soft">{TYPE_SHORT[it.data.question_type]}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
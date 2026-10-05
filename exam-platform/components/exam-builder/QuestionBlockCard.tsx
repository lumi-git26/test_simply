"use client";

import { QuestionBlockData } from "@/lib/blocks";
import { QuestionType } from "@/lib/types";
import { RichTextField } from "@/components/exam-builder/RichTextField";

const TYPE_LABELS: Record<QuestionType, string> = {
  multiple_choice: "Multiple choice",
  fill_blank: "Fill in the blank",
  order: "Order",
  writing_rewrite: "Rewrite",
  writing_rearrange: "Rearrange",
};

export function QuestionBlockCard({
  index,
  data,
  readingOptions,
  passageBlockId,
  onChangePassage,
  onChange,
  onDelete,
}: {
  index: number;
  data: QuestionBlockData;
  readingOptions: { id: string; label: string }[];
  passageBlockId: string | null;
  onChangePassage: (id: string | null) => void;
  onChange: (data: QuestionBlockData) => void;
  onDelete: () => void;
}) {
  function setOption(key: "A" | "B" | "C" | "D", val: string) {
    onChange({ ...data, options: { ...data.options, [key]: val } });
  }

  return (
    <div className="group rounded-card border border-border p-4">
      <div className="mb-3 flex items-center justify-between text-sm">
        <span className="text-ink-soft">Q{index + 1}</span>
        <div className="flex items-center gap-2">
          <select
            className="rounded-full border border-border bg-paper px-2 py-1 text-xs"
            value={data.question_type}
            onChange={(e) => onChange({ ...data, question_type: e.target.value as QuestionType })}
          >
            {Object.entries(TYPE_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
          <button
            onClick={onDelete}
            className="opacity-0 group-hover:opacity-100 text-red-600 transition"
          >
            ✕
          </button>
        </div>
      </div>

      {readingOptions.length > 0 && (
        <select
          className="mb-2 w-full rounded border border-border bg-paper px-2 py-1 text-xs text-ink-soft"
          value={passageBlockId ?? ""}
          onChange={(e) => onChangePassage(e.target.value || null)}
        >
          <option value="">No passage</option>
          {readingOptions.map((r) => (
            <option key={r.id} value={r.id}>{r.label || "Untitled passage"}</option>
          ))}
        </select>
      )}

      <RichTextField
        multiline
        placeholder={data.question_type === "multiple_choice" ? "Question (optional)" : "Question text"}
        value={data.question_text}
        onChange={(val) => onChange({ ...data, question_text: val })}
      />

      <details className="mt-2">
        <summary className="cursor-pointer text-xs text-ink-soft">+ Context</summary>
        <div className="mt-1">
          <RichTextField
            placeholder="e.g. A: ..."
            value={data.context}
            onChange={(val) => onChange({ ...data, context: val })}
          />
        </div>
      </details>

      {data.question_type === "multiple_choice" && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          {(["A", "B", "C", "D"] as const).map((key) => (
            <div
              key={key}
              className="flex items-start gap-2 rounded-lg border border-border px-2 py-1.5"
            >
              <span className="mt-2 text-xs font-bold text-ink-soft">{key}</span>
              <div className="flex-1">
                <RichTextField value={data.options[key]} onChange={(val) => setOption(key, val)} />
              </div>
              <button
                type="button"
                onClick={() => onChange({ ...data, correct_letter: key })}
                className={`mt-2 h-4 w-4 shrink-0 rounded-full border-2 transition
                  ${data.correct_letter === key ? "border-ink bg-ink" : "border-ink-soft/30"}`}
              />
            </div>
          ))}
        </div>
      )}

      {data.question_type === "fill_blank" && (
        <input
          className="input-field mt-3"
          placeholder="Correct answer(s), separated by ;"
          value={data.fill_answer}
          onChange={(e) => onChange({ ...data, fill_answer: e.target.value })}
        />
      )}

      {data.question_type === "order" && (
        <div className="mt-3 space-y-1.5">
          {data.order_items.map((item: string, i: number) => (
            <div key={i} className="flex items-center gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink text-[10px] text-paper">
                {i + 1}
              </span>
              <input
                className="input-field flex-1 py-1.5"
                value={item}
                onChange={(e) => {
                  const next = [...data.order_items];
                  next[i] = e.target.value;
                  onChange({ ...data, order_items: next });
                }}
              />
              <button
                type="button"
                disabled={data.order_items.length <= 2}
                onClick={() => onChange({ ...data, order_items: data.order_items.filter((_: string, idx: number) => idx !== i) })}
                className="text-red-600 disabled:opacity-30"
              >
                ✕
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => onChange({ ...data, order_items: [...data.order_items, ""] })}
            className="text-xs text-ink-soft hover:text-ink"
          >
            + Add item
          </button>
        </div>
      )}

      {(data.question_type === "writing_rewrite" || data.question_type === "writing_rearrange") && (
        <input
          className="input-field mt-3"
          placeholder="Model answer(s), separated by ;"
          value={data.writing_answers}
          onChange={(e) => onChange({ ...data, writing_answers: e.target.value })}
        />
      )}

      <label className="mt-2 flex items-center gap-2 text-xs text-ink-soft">
        Points
        <input
          type="number"
          min={0.5}
          step={0.5}
          className="w-14 rounded border border-border bg-paper px-1.5 py-0.5"
          value={data.points}
          onChange={(e) => onChange({ ...data, points: Number(e.target.value) })}
        />
      </label>
    </div>
  );
}
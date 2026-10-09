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
  onChange,
  onDelete,
}: {
  index: number;
  data: QuestionBlockData;
  onChange: (data: QuestionBlockData) => void;
  onDelete: () => void;
}) {
  function setOption(key: "A" | "B" | "C" | "D", val: string) {
    onChange({ ...data, options: { ...data.options, [key]: val } });
  }

  return (
    <div className="rounded-card bg-paper-dark p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="cursor-grab select-none text-ink-soft/50">⠿</span>
          <span className="font-semibold">Question {index + 1}</span>
        </div>
        <div className="flex items-center gap-2">
          <select
            className="rounded-md border border-border bg-paper px-2 py-1 text-xs text-ink-soft"
            value={data.question_type}
            onChange={(e) => onChange({ ...data, question_type: e.target.value as QuestionType })}
          >
            {Object.entries(TYPE_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
          <button onClick={onDelete} className="text-ink-soft hover:text-red-600">✕</button>
        </div>
      </div>

      <div className="mb-3 rounded-md bg-paper px-4 py-3">
        <RichTextField
          multiline
          placeholder={data.question_type === "multiple_choice" ? "Question (optional)" : "Question text"}
          value={data.question_text}
          onChange={(val) => onChange({ ...data, question_text: val })}
        />
      </div>

      <details className="mb-3">
        <summary className="cursor-pointer text-xs text-ink-soft">+ Context</summary>
        <div className="mt-2 rounded-md bg-paper px-4 py-2">
          <RichTextField
            placeholder="e.g. A: ..."
            value={data.context}
            onChange={(val) => onChange({ ...data, context: val })}
          />
        </div>
      </details>

      {data.question_type === "multiple_choice" && (
        <div className="space-y-2">
          {(["A", "B", "C", "D"] as const).map((key) => {
            const isCorrect = data.correct_letter === key;
            return (
              <div key={key} className="flex items-center gap-2 rounded-md bg-paper px-3 py-2">
                <span className="cursor-grab select-none text-ink-soft/40">⠿</span>
                <span className="w-4 text-sm font-semibold text-ink-soft">{key}</span>
                <div className="flex-1">
                  <RichTextField value={data.options[key]} onChange={(val) => setOption(key, val)} />
                </div>
                <button
                  type="button"
                  onClick={() => onChange({ ...data, correct_letter: key })}
                  title="Mark as correct"
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold transition
                    ${isCorrect ? "bg-emerald-500 text-white" : "bg-sky-100 text-sky-300 hover:bg-sky-200"}
                  `}
                >
                  ✓
                </button>
              </div>
            );
          })}
        </div>
      )}

      {data.question_type === "fill_blank" && (
        <div className="rounded-md bg-paper px-4 py-2">
          <input
            className="w-full bg-transparent py-1 outline-none placeholder:text-ink-soft/50"
            placeholder="Correct answer(s), separated by ;"
            value={data.fill_answer}
            onChange={(e) => onChange({ ...data, fill_answer: e.target.value })}
          />
        </div>
      )}

      {data.question_type === "order" && (
        <div className="space-y-2">
          {data.order_items.map((item: string, i: number) => (
            <div key={i} className="flex items-center gap-2 rounded-md bg-paper px-3 py-2">
              <span className="cursor-grab select-none text-ink-soft/40">⠿</span>
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink text-[10px] text-paper">
                {i + 1}
              </span>
              <input
                className="flex-1 bg-transparent py-1 outline-none"
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
                className="text-ink-soft hover:text-red-600 disabled:opacity-30"
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
        <div className="rounded-md bg-paper px-4 py-2">
          <input
            className="w-full bg-transparent py-1 outline-none placeholder:text-ink-soft/50"
            placeholder="Model answer(s), separated by ;"
            value={data.writing_answers}
            onChange={(e) => onChange({ ...data, writing_answers: e.target.value })}
          />
        </div>
      )}

      <label className="mt-3 flex items-center gap-2 text-xs text-ink-soft">
        Points
        <input
          type="number"
          min={0.5}
          step={0.5}
          className="w-14 rounded-md border border-border bg-paper px-1.5 py-0.5"
          value={data.points}
          onChange={(e) => onChange({ ...data, points: Number(e.target.value) })}
        />
      </label>
    </div>
  );
}
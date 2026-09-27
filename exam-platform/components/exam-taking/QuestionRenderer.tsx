"use client";

import { useState } from "react";
import { PublicQuestion } from "@/lib/types";
import { mcLayout } from "@/lib/mc-layout";

export function QuestionRenderer({
  index,
  question,
  value,
  onChange,
  showInstruction,
}: {
  index: number;
  question: PublicQuestion;
  value: string;
  onChange: (val: string) => void;
  showInstruction?: boolean;
}) {
  const hasStem = question.question_text.trim().length > 0;

  return (
    <div>
      {showInstruction && question.instruction && (
        <p className="mb-3 italic font-semibold text-ink">{question.instruction}</p>
      )}

      {/* Context (dialogue/conversation setup) shown separately, before the
          question itself — e.g. "Linh is walking home. Her friend, Nam,
          offers a ride." shown before the actual line to complete. */}
      {question.context && (
        <p className="mb-2 text-ink-soft">{question.context}</p>
      )}

      <p className="text-lg">
        Question {index + 1}
        {hasStem && "."}{" "}
        {hasStem &&
          (question.question_type === "fill_blank" ? (
            <InlineBlank question={question} value={value} onChange={onChange} />
          ) : (
            question.question_text
          ))}
      </p>

      {question.question_type === "multiple_choice" && question.options && (
        <MultipleChoiceOptions
          options={question.options as Record<"A" | "B" | "C" | "D", string>}
          value={value}
          onChange={onChange}
        />
      )}

      {question.question_type === "order" && Array.isArray(question.options) && (
        <OrderQuestion items={question.options as unknown as string[]} value={value} onChange={onChange} />
      )}

      {(question.question_type === "writing_rewrite" ||
        question.question_type === "writing_rearrange") && (
        <textarea
          className="input-field mt-4 min-h-[100px]"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Type your answer"
        />
      )}
    </div>
  );
}

function MultipleChoiceOptions({
  options,
  value,
  onChange,
}: {
  options: Record<"A" | "B" | "C" | "D", string>;
  value: string;
  onChange: (val: string) => void;
}) {
  const layout = mcLayout(options);
  const containerClass =
    layout === "grid-4"
      ? "grid grid-cols-2 sm:grid-cols-4 gap-3"
      : layout === "grid-2"
      ? "grid grid-cols-1 sm:grid-cols-2 gap-3"
      : "flex flex-col gap-2";

  return (
    <div className={`mt-4 ${containerClass}`}>
      {(["A", "B", "C", "D"] as const).map((key) => {
        const selected = value === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            className={`rounded-lg border px-4 py-2 text-left transition
              ${selected ? "border-ink bg-ink text-paper" : "border-transparent hover:border-ink"}
            `}
          >
            {key}. {options[key]}
          </button>
        );
      })}
    </div>
  );
}

// Drag-and-drop reordering for "order" type questions (a/b/c/d sentence
// ordering). value is stored as comma-separated indices into `items`
// representing the student's current order, e.g. "2,0,1".
function OrderQuestion({
  items,
  value,
  onChange,
}: {
  items: string[];
  value: string;
  onChange: (val: string) => void;
}) {
  const order = value
    ? value.split(",").map(Number)
    : items.map((_, i) => i);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  function move(from: number, to: number) {
    const next = [...order];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next.join(","));
  }

  return (
    <div className="mt-4 space-y-2">
      {order.map((itemIndex, pos) => (
        <div
          key={itemIndex}
          draggable
          onDragStart={() => setDragIndex(pos)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => {
            if (dragIndex !== null && dragIndex !== pos) move(dragIndex, pos);
            setDragIndex(null);
          }}
          className="flex cursor-grab items-center gap-3 rounded-lg border border-border bg-paper px-4 py-3 active:cursor-grabbing"
        >
          <span className="select-none text-ink-soft">⠿</span>
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-ink text-sm text-paper">
            {pos + 1}
          </span>
          <span className="flex-1">{items[itemIndex]}</span>
          <div className="flex gap-1">
            <button
              type="button"
              disabled={pos === 0}
              onClick={() => move(pos, pos - 1)}
              className="rounded border border-border px-2 py-1 text-xs disabled:opacity-30"
            >
              ↑
            </button>
            <button
              type="button"
              disabled={pos === order.length - 1}
              onClick={() => move(pos, pos + 1)}
              className="rounded border border-border px-2 py-1 text-xs disabled:opacity-30"
            >
              ↓
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function InlineBlank({
  question,
  value,
  onChange,
}: {
  question: PublicQuestion;
  value: string;
  onChange: (val: string) => void;
}) {
  if (!question.question_text.includes("___")) {
    return (
      <>
        {question.question_text}
        <input
          className="ml-2 inline-block w-32 rounded border border-ink px-2 py-1"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </>
    );
  }
  const [before, after] = question.question_text.split("___");
  return (
    <>
      {before}
      <input
        className="mx-1 inline-block w-28 rounded border border-ink px-2 py-1 text-center"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {after}
    </>
  );
}
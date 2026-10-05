"use client";

import { useState } from "react";
import { Block } from "@/lib/blocks";
import { parseRichText } from "@/lib/richtext";
import { mcLayout } from "@/lib/mc-layout";

export function PreviewModal({ blocks, onClose }: { blocks: Block[]; onClose: () => void }) {
  const [answers, setAnswers] = useState<Record<string, string>>({});

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-paper">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-paper/90 px-6 py-4 backdrop-blur">
        <p className="font-semibold">Preview (not graded)</p>
        <button onClick={onClose} className="btn-outline px-4 py-2 text-sm">Close</button>
      </div>

      <div className="mx-auto max-w-3xl space-y-10 px-6 py-10 md:px-16">
        {(() => {
          let qIndex = 0;
          return blocks.map((b) => {
            if (b.type === "instruction") {
              return b.data.text ? (
                <p key={b.id} className="italic font-semibold text-ink">{parseRichText(b.data.text)}</p>
              ) : null;
            }
            if (b.type === "reading") {
              return (
                <div key={b.id} className="rounded-card border border-border bg-paper-dark p-6">
                  {b.data.title && <h2 className="mb-2 font-bold">{b.data.title}</h2>}
                  <p className="whitespace-pre-line text-ink-soft">{parseRichText(b.data.body)}</p>
                </div>
              );
            }

            const i = qIndex++;
            const d = b.data;
            const hasStem = d.question_text.trim().length > 0;

            return (
              <div key={b.id}>
                {d.context && <p className="mb-2 text-ink-soft">{parseRichText(d.context)}</p>}

                <p className="text-lg">
                  Question {i + 1}
                  {hasStem && "."}{" "}
                  {hasStem && parseRichText(d.question_text)}
                </p>

                {d.question_type === "multiple_choice" && (
                  <MCOptionsPreview
                    options={d.options}
                    selected={answers[b.id]}
                    onSelect={(key) => setAnswers((a) => ({ ...a, [b.id]: key }))}
                  />
                )}

                {d.question_type === "fill_blank" && (
                  <InlineBlankPreview text={d.question_text} value={answers[b.id] ?? ""} onChange={(v) => setAnswers((a) => ({ ...a, [b.id]: v }))} />
                )}

                {d.question_type === "order" && (
                  <div className="mt-4 space-y-2">
                    {d.order_items.filter((s) => s.trim()).map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3 rounded-lg border border-border bg-paper px-4 py-3">
                        <span className="select-none text-ink-soft">⠿</span>
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-ink text-sm text-paper">{idx + 1}</span>
                        <span className="flex-1">{parseRichText(item)}</span>
                      </div>
                    ))}
                    <p className="text-xs text-ink-soft">(Order is shuffled for real students)</p>
                  </div>
                )}

                {(d.question_type === "writing_rewrite" || d.question_type === "writing_rearrange") && (
                  <textarea
                    className="input-field mt-4 min-h-[100px]"
                    placeholder="Type your answer"
                    value={answers[b.id] ?? ""}
                    onChange={(e) => setAnswers((a) => ({ ...a, [b.id]: e.target.value }))}
                  />
                )}
              </div>
            );
          });
        })()}
      </div>
    </div>
  );
}

function MCOptionsPreview({
  options,
  selected,
  onSelect,
}: {
  options: Record<"A" | "B" | "C" | "D", string>;
  selected?: string;
  onSelect: (key: "A" | "B" | "C" | "D") => void;
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
        const isSelected = selected === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onSelect(key)}
            className={`rounded-lg border px-4 py-2 text-left transition
              ${isSelected ? "border-ink bg-ink text-paper" : "border-transparent hover:border-ink"}
            `}
          >
            {key}. {parseRichText(options[key])}
          </button>
        );
      })}
    </div>
  );
}

function InlineBlankPreview({
  text,
  value,
  onChange,
}: {
  text: string;
  value: string;
  onChange: (val: string) => void;
}) {
  if (!text.includes("___")) {
    return (
      <input
        className="mt-4 w-32 rounded border border-ink px-2 py-1"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }
  // text already rendered above via parseRichText in the question line, so
  // here we only need a standalone input since the inline split happens
  // only on the raw string — reuse the same split for consistency.
  return (
    <input
      className="mt-4 w-32 rounded border border-ink px-2 py-1 text-center"
      placeholder="___"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
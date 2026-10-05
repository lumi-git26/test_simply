"use client";

import { useState } from "react";
import { Block } from "@/lib/blocks";
import { parseRichText } from "@/lib/richtext";

export function PreviewModal({ blocks, onClose }: { blocks: Block[]; onClose: () => void }) {
  const [answers, setAnswers] = useState<Record<string, string>>({});

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-paper">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-paper/90 px-6 py-4 backdrop-blur">
        <p className="font-semibold">Xem trước bài thi (chế độ Preview — không tính điểm)</p>
        <button onClick={onClose} className="btn-outline py-2 px-4">Đóng</button>
      </div>

      <div className="mx-auto max-w-3xl space-y-10 px-6 py-10">
        {(() => {
          let qIndex = 0;
          return blocks.map((b) => {
            if (b.type === "instruction") {
              return b.data.text ? (
                <p key={b.id} className="italic font-semibold">{parseRichText(b.data.text)}</p>
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
            // question
            const i = qIndex++;
            const d = b.data;
            return (
              <div key={b.id}>
                {d.context && <p className="mb-2 text-ink-soft">{parseRichText(d.context)}</p>}
                <p className="text-lg">
                  Question {i + 1}.{" "}
                  {d.question_text && parseRichText(d.question_text)}
                </p>

                {d.question_type === "multiple_choice" && (
                  <div className="mt-4 flex flex-wrap gap-3">
                    {(["A", "B", "C", "D"] as const).map((k) => (
                      <button
                        key={k}
                        onClick={() => setAnswers((a) => ({ ...a, [b.id]: k }))}
                        className={`rounded-lg border px-4 py-2 text-left transition ${
                          answers[b.id] === k ? "border-ink bg-ink text-paper" : "border-transparent hover:border-ink"
                        }`}
                      >
                        {k}. {parseRichText(d.options[k])}
                      </button>
                    ))}
                  </div>
                )}

                {d.question_type === "fill_blank" && (
                  <input className="input-field mt-4 max-w-xs" placeholder="Type your answer" disabled />
                )}

                {d.question_type === "order" && (
                  <div className="mt-4 space-y-2">
                    <p className="text-xs text-ink-soft">
                      (Preview — thứ tự thật sẽ bị xáo trộn ngẫu nhiên khi học sinh làm bài)
                    </p>
                    {d.order_items.filter((s) => s.trim()).map((item, idx) => (
                      <div key={idx} className="rounded-lg border border-border bg-paper px-4 py-2">
                        {parseRichText(item)}
                      </div>
                    ))}
                  </div>
                )}

                {(d.question_type === "writing_rewrite" || d.question_type === "writing_rearrange") && (
                  <textarea className="input-field mt-4 min-h-[80px]" placeholder="Type your answer" disabled />
                )}
              </div>
            );
          });
        })()}
      </div>
    </div>
  );
}
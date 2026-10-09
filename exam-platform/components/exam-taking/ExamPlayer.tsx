"use client";

import { useEffect, useRef, useState } from "react";
import { ExamHeader } from "@/components/exam-taking/ExamHeader";
import { QuestionRenderer } from "@/components/exam-taking/QuestionRenderer";
import { FitPassage } from "@/components/exam-taking/FitPassage";
import { ExamPart } from "@/lib/parts";

// Content fades in slightly after the side panel starts expanding.
const FADE = { animation: "examFadeIn 350ms ease 150ms both" } as const;

export function ExamPlayer({
  title,
  timeText,
  low,
  parts,
  answers,
  onAnswer,
  onSubmit,
  submitting,
  preview,
}: {
  title: string;
  timeText: string | null;
  low?: boolean;
  parts: ExamPart[];
  answers: Record<string, string>;
  onAnswer: (questionId: string, value: string) => void;
  onSubmit: () => void;
  submitting?: boolean;
  preview?: boolean;
}) {
  const [partIndex, setPartIndex] = useState(0);
  const [headerHidden, setHeaderHidden] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const questionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const mounted = useRef(false);

  // Floating header appears only after the original header scrolls out of view.
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => setHeaderHidden(!e.isIntersecting), {
      threshold: 0,
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Jump back to the top when switching part (but not on first render).
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    sentinelRef.current?.scrollIntoView({ block: "start" });
  }, [partIndex]);

  if (parts.length === 0) {
    return (
      <main className="flex min-h-screen items-center justify-center text-ink-soft">
        This exam has no questions yet.
      </main>
    );
  }

  const idx = Math.min(partIndex, parts.length - 1);
  const part = parts[idx];
  const isLast = idx === parts.length - 1;
  const isPassage = part.kind === "passage";
  const answered = (id: string) => !!answers[id]?.trim();

  const submitButton = (
    <button className="btn-primary" disabled={submitting || preview} onClick={onSubmit}>
      {preview ? "Submit (disabled in preview)" : submitting ? "Submitting…" : "Submit"}
    </button>
  );

  return (
    <main className="min-h-screen px-6 pb-10 md:px-12">
      <div
        className={`fixed left-0 right-0 top-0 z-40 transition-opacity duration-300 ${
          headerHidden ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <ExamHeader title={title} timeText={timeText} low={low} floating />
      </div>

      <div ref={sentinelRef}>
        <ExamHeader title={title} timeText={timeText} low={low} />
      </div>

      <div className="mt-6 flex flex-col gap-8 md:flex-row md:items-start">
        {/* ---------- Left: questions (Part 1) or passage (Part 2.x) ---------- */}
        <section key={idx} className="min-w-0 md:flex-1" style={FADE}>
          {part.kind === "passage" ? (
            <FitPassage title={part.passage.title} body={part.passage.body} />
          ) : (
            <div className="space-y-12">
              {part.questions.map((q, i) => (
                <div
                  key={q.id}
                  ref={(el) => {
                    questionRefs.current[q.id] = el;
                  }}
                  className="scroll-mt-24"
                >
                  <QuestionRenderer
                    index={i}
                    question={q}
                    value={answers[q.id] ?? ""}
                    onChange={(v) => onAnswer(q.id, v)}
                    showInstruction={!!q.instruction && q.instruction !== part.questions[i - 1]?.instruction}
                  />
                </div>
              ))}
              {isLast && <div className="flex justify-end">{submitButton}</div>}
            </div>
          )}
        </section>

        {/* ---------- Right: one panel that expands between Part 1 and Part 2 ---------- */}
        <aside
          className="md:sticky md:top-24 md:w-[var(--panel-w)] md:shrink-0 md:transition-[width] md:duration-500 md:ease-in-out"
          style={{ "--panel-w": isPassage ? "max(420px, 36vw)" : "360px" } as React.CSSProperties}
        >
          <div className="flex flex-col rounded-card bg-ink text-paper md:h-[calc(100vh-7rem)]">
            <div className="flex shrink-0 items-center justify-between px-5 py-4">
              <button
                onClick={() => setPartIndex(idx - 1)}
                disabled={idx === 0}
                className="px-2 font-bold disabled:opacity-25"
                aria-label="Previous part"
              >
                &lt;
              </button>
              <span className="font-semibold">{part.label}</span>
              <button
                onClick={() => setPartIndex(idx + 1)}
                disabled={isLast}
                className="px-2 font-bold disabled:opacity-25"
                aria-label="Next part"
              >
                &gt;
              </button>
            </div>

            {part.kind === "questions" ? (
              <div key={idx} style={FADE} className="min-h-0 flex-1 overflow-y-auto px-5 pb-5">
                <div className="grid grid-cols-4 gap-3">
                  {part.questions.map((q, i) => (
                    <button
                      key={q.id}
                      onClick={() =>
                        questionRefs.current[q.id]?.scrollIntoView({ behavior: "smooth", block: "center" })
                      }
                      className={`flex h-14 w-14 items-center justify-center rounded-full border text-lg font-bold transition ${
                        answered(q.id)
                          ? "border-green-500 bg-green-500 text-white"
                          : "border-paper/40 bg-transparent text-paper"
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div key={idx} style={FADE} className="min-h-0 flex-1 px-3 pb-3">
                <div className="h-full space-y-8 overflow-y-auto rounded-md bg-paper p-5 text-ink">
                  {part.questions.map((q, i) => (
                    <QuestionRenderer
                      key={q.id}
                      index={i}
                      compact
                      question={q}
                      value={answers[q.id] ?? ""}
                      onChange={(v) => onAnswer(q.id, v)}
                      showInstruction={!!q.instruction && q.instruction !== part.questions[i - 1]?.instruction}
                    />
                  ))}
                  {isLast && <div className="flex justify-end pt-2">{submitButton}</div>}
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}
"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { QuestionNavigator } from "@/components/exam-taking/QuestionNavigator";

type ReviewQuestion = {
  id: string;
  passage_id: string | null;
  question_type: string;
  question_text: string;
  options: Record<"A" | "B" | "C" | "D", string> | null;
  correct_answer: string;
  explanation: string | null;
  student_answer: string;
  is_correct: boolean | null;
};

type ReviewData = {
  examTitle: string;
  totalScore: number;
  maxScore: number;
  passages: { id: string; title: string | null; body: string }[];
  questions: ReviewQuestion[];
};

// Thin, hand-drawn check/x marks — not icon glyphs.
function Check({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      <path d="M4 12.5L9.5 18L20 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function Cross({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      <path d="M5 5L19 19M19 5L5 19" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export default function ResultPage() {
  const search = useSearchParams();
  const showResult = search.get("show") === "true";
  const submissionId = search.get("submissionId");

  const [revealed, setRevealed] = useState(false);
  const [review, setReview] = useState<ReviewData | null>(null);
  const refs = typeof window !== "undefined" ? (window as any).__reviewRefs ?? {} : {};

  async function viewResult() {
    const res = await fetch(`/api/submissions/${submissionId}/review`);
    const data = await res.json();
    setReview(data);
    setRevealed(true);
  }

  function scrollTo(i: number) {
    document.getElementById(`review-q-${i}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  if (!revealed || !review) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <div className="w-full max-w-md">
          <div className="mb-6 text-5xl">✅</div>
          <h1 className="text-2xl font-bold">You've completed the exam!</h1>
          {showResult && (
            <button className="btn-primary mt-8 w-full" onClick={viewResult}>
              View result
            </button>
          )}
          {!showResult && (
            <p className="mt-4 text-ink-soft">Kết quả sẽ có sau khi giáo viên duyệt bài.</p>
          )}
        </div>
      </main>
    );
  }

  const results = review.questions.map((q) => q.is_correct);

  return (
    <main className="min-h-screen px-6 py-10 md:px-16">
      <div className="mb-10">
        <h1 className="text-2xl font-bold">{review.examTitle}</h1>
        <p className="mt-2 text-xl">
          Score: {review.totalScore} / {review.maxScore}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-12 md:grid-cols-[1fr_360px]">
        <div className="space-y-10">
          {review.questions.map((q, i) => {
            const passage = q.passage_id ? review.passages.find((p) => p.id === q.passage_id) : null;
            const isFirstOfPassage =
              passage && review.questions.findIndex((qq) => qq.passage_id === q.passage_id) === i;
            const correct = q.is_correct;

            return (
              <div key={q.id} id={`review-q-${i}`} className="scroll-mt-10">
                {isFirstOfPassage && passage && (
                  <div className="mb-6 rounded-card border border-border bg-paper-dark p-6">
                    {passage.title && <h2 className="mb-2 font-bold">{passage.title}</h2>}
                    <p className="whitespace-pre-line text-ink-soft">{passage.body}</p>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <p className={`text-lg ${correct ? "text-green-600" : "text-red-600"}`}>
                      Question {i + 1}. {q.question_text}
                    </p>

                    {q.question_type === "multiple_choice" && q.options && (
                      <div className="mt-3 flex flex-wrap gap-3">
                        {(["A", "B", "C", "D"] as const).map((key) => {
                          const isStudent = q.student_answer === key;
                          const isCorrectKey = q.correct_answer === key;
                          const color = isCorrectKey
                            ? "text-green-600"
                            : isStudent
                            ? "text-red-600"
                            : "text-ink";
                          return (
                            <span key={key} className={color}>
                              {key}. {q.options![key]}
                            </span>
                          );
                        })}
                      </div>
                    )}

                    {q.question_type !== "multiple_choice" && (
                      <p className={`mt-3 ${correct ? "text-green-600" : "text-red-600"}`}>
                        Đáp án của bạn: {q.student_answer || "(bỏ trống)"}
                      </p>
                    )}

                    {!correct && (
                      <p className="mt-1 text-sm text-ink-soft">
                        Đáp án đúng: <span className="text-green-600">{q.correct_answer}</span>
                      </p>
                    )}
                  </div>

                  {correct === true && <Check className="mt-1 h-6 w-6 shrink-0 text-green-600" />}
                  {correct === false && <Cross className="mt-1 h-6 w-6 shrink-0 text-red-600" />}
                </div>
              </div>
            );
          })}
        </div>

        <QuestionNavigator
          total={review.questions.length}
          mode="review"
          results={results}
          onJump={scrollTo}
        />
      </div>
    </main>
  );
}
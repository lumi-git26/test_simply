"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { Timer } from "@/components/exam-taking/Timer";
import { QuestionNavigator } from "@/components/exam-taking/QuestionNavigator";
import { QuestionRenderer } from "@/components/exam-taking/QuestionRenderer";
import { PublicQuestion } from "@/lib/types";

type StartResponse = {
  submissionId: string;
  exam: { id: string; title: string; time_limit_minutes: number | null };
  passages: { id: string; title: string | null; body: string }[];
  questions: PublicQuestion[];
  deadline: number | null;
};

export default function TakeExamPage() {
  const params = useParams<{ slug: string }>();
  const search = useSearchParams();
  const router = useRouter();

  const [data, setData] = useState<StartResponse | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const refs = useRef<Record<number, HTMLDivElement | null>>({});

  useEffect(() => {
    fetch(`/api/exams/${params.slug}/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: search.get("name") ?? undefined }),
    })
      .then((r) => r.json())
      .then(setData);
  }, [params.slug, search]);

  const submit = useCallback(
    async (autoSubmitted = false) => {
      if (!data || submitting) return;
      setSubmitting(true);
      const payload = {
        answers: Object.entries(answers).map(([question_id, value]) => ({ question_id, value })),
        autoSubmitted,
      };
      const res = await fetch(`/api/submissions/${data.submissionId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      const qs = new URLSearchParams({
        submissionId: data.submissionId,
        show: String(result.showResultInstantly),
      });
      router.push(`/exam/${params.slug}/result?${qs.toString()}`);
    },
    [data, answers, submitting, params.slug, router]
  );

  if (!data) {
    return <main className="flex min-h-screen items-center justify-center">Loading…</main>;
  }

  const answeredSet = new Set(
    data.questions.map((q, i) => (answers[q.id]?.trim() ? i : -1)).filter((i) => i >= 0)
  );

  function scrollTo(i: number) {
    refs.current[i]?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <main className="min-h-screen px-6 py-10 md:px-16">
      <div className="mb-10 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{data.exam.title}</h1>
        {data.deadline && <Timer deadline={data.deadline} onExpire={() => submit(true)} />}
      </div>

      <div className="grid grid-cols-1 gap-12 md:grid-cols-[1fr_360px]">
        <div className="space-y-12">
          {data.questions.map((question, i) => {
            const passage = question.passage_id
              ? data.passages.find((p) => p.id === question.passage_id)
              : null;
            // only show the passage box once, right before its first question
            const isFirstOfPassage =
              passage &&
              data.questions.findIndex((q) => q.passage_id === question.passage_id) === i;

            return (
              <div
                key={question.id}
                ref={(el) => {
                  refs.current[i] = el;
                }}
                className="scroll-mt-10"
              >
                {isFirstOfPassage && passage && (
                  <div className="mb-6 rounded-card border border-border bg-paper-dark p-6">
                    {passage.title && <h2 className="mb-2 font-bold">{passage.title}</h2>}
                    <p className="whitespace-pre-line text-ink-soft">{passage.body}</p>
                  </div>
                )}
                <QuestionRenderer
                  index={i}
                  question={question}
                  value={answers[question.id] ?? ""}
                  onChange={(val) => setAnswers((a) => ({ ...a, [question.id]: val }))}
                />
              </div>
            );
          })}

          <div className="flex justify-end">
            <button className="btn-primary" disabled={submitting} onClick={() => submit(false)}>
              {submitting ? "Submitting…" : "Submit"}
            </button>
          </div>
        </div>

        <QuestionNavigator
          total={data.questions.length}
          mode="taking"
          answered={answeredSet}
          onJump={scrollTo}
        />
      </div>
    </main>
  );
}
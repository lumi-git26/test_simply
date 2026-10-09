"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useCountdown } from "@/components/exam-taking/useCountdown";
import { ExamPlayer } from "@/components/exam-taking/ExamPlayer";
import { buildParts } from "@/lib/parts";
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

  const { mm, ss, low } = useCountdown(data?.deadline ?? null, () => submit(true));
  const parts = useMemo(() => (data ? buildParts(data.questions, data.passages) : []), [data]);

  if (!data) {
    return <main className="flex min-h-screen items-center justify-center">Loading…</main>;
  }

  return (
    <ExamPlayer
      title={data.exam.title}
      timeText={data.deadline ? `${mm}:${ss}` : null}
      low={low}
      parts={parts}
      answers={answers}
      onAnswer={(id, value) => setAnswers((a) => ({ ...a, [id]: value }))}
      onSubmit={() => submit(false)}
      submitting={submitting}
    />
  );
}
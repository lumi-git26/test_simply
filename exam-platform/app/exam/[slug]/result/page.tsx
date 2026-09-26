"use client";

import { useState } from "react";
import { useSearchParams, useParams } from "next/navigation";
import { Button } from "@/components/ui/Button";

export default function ResultPage() {
  const search = useSearchParams();
  const params = useParams<{ slug: string }>();
  const showResult = search.get("show") === "true";
  const submissionId = search.get("submissionId");

  const [revealed, setRevealed] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [score, setScore] = useState<{ total: number; max: number } | null>(null);

  async function viewResult() {
    const res = await fetch(`/api/submissions/${submissionId}`);
    const data = await res.json();
    setScore({ total: data.total_score, max: data.max_score });
    setRevealed(true);
  }

  async function subscribe() {
    await fetch(`/api/exams/${params.slug}/subscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setSubscribed(true);
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="w-full max-w-md">
        <div className="mb-6 text-5xl">✅</div>
        <h1 className="text-2xl font-bold">You've completed the exam!</h1>

        {revealed && score && (
          <p className="mt-4 text-xl">
            Score: {score.total} / {score.max}
          </p>
        )}

        {showResult && !revealed && (
          <Button className="mt-8 w-full" onClick={viewResult}>
            View result
          </Button>
        )}

        {!subscribed ? (
          !subscribing ? (
            <button className="mt-4 text-ink-soft underline" onClick={() => setSubscribing(true)}>
              Subscribe to get notified about new exercises
            </button>
          ) : (
            <div className="mt-4 flex gap-2">
              <input
                className="input-field"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Button onClick={subscribe}>Subscribe</Button>
            </div>
          )
        ) : (
          <p className="mt-4 text-ink-soft">You're subscribed 🎉</p>
        )}
      </div>
    </main>
  );
}

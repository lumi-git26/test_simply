"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

// Matches screenshot 1: name field (4-15 letters) with a submit arrow that
// only appears once valid, plus an "Start anonymously" fallback.
export default function EnterNamePage({ params }: { params: { slug: string } }) {
  const [name, setName] = useState("");
  const router = useRouter();

  const isValid = name.trim().length >= 4 && name.trim().length <= 15;

  function goToIntro(studentName?: string) {
    const qs = studentName ? `?name=${encodeURIComponent(studentName)}` : "";
    router.push(`/exam/${params.slug}/intro${qs}`);
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="w-full max-w-md">
        <label className="mb-3 block text-lg font-bold">Please enter your name</label>
        <div className="relative">
          <input
            className="input-field pr-14"
            value={name}
            maxLength={15}
            onChange={(e) => setName(e.target.value)}
            placeholder=""
          />
          {isValid && (
            <button
              aria-label="Continue"
              onClick={() => goToIntro(name.trim())}
              className="absolute right-2 top-1/2 -translate-y-1/2 flex h-9 w-9
                         items-center justify-center rounded-full bg-ink text-paper"
            >
              →
            </button>
          )}
        </div>

        <div className="my-8 flex items-center gap-4 text-ink-soft">
          <div className="h-px flex-1 bg-border" />
          <span>or</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <Button className="w-full" onClick={() => goToIntro()}>
          Start anonymously
        </Button>
      </div>
    </main>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { Exam, ExamSettings, Question, Passage } from "@/lib/types";
import { BlockEditor } from "@/components/exam-builder/BlockEditor";
import { SharePopup } from "@/components/exam-builder/SharePopup";

export function ExamEditor({
  exam,
  settings,
  initialQuestions,
  initialPassages,
}: {
  exam: Exam;
  settings: ExamSettings;
  initialQuestions: Question[];
  initialPassages: Passage[];
}) {
  const [title, setTitle] = useState(exam.title);
  const [timeLimit, setTimeLimit] = useState(exam.time_limit_minutes ?? "");
  const [status, setStatus] = useState(exam.status);
  const [showShare, setShowShare] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [saveTrigger, setSaveTrigger] = useState(0);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  async function saveHeader() {
    await fetch(`/api/exams/${exam.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        time_limit_minutes: timeLimit === "" ? null : Number(timeLimit),
      }),
    });
  }

  return (
    <div className="min-h-screen">
      {/* ---------- Top bar ---------- */}
<header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between overflow-hidden border-b border-border bg-paper/90 px-6 backdrop-blur">
  <div className="flex min-w-0 items-center gap-3">
    <Link href="/dashboard" className="shrink-0 text-ink-soft hover:text-ink">←</Link>
    <input
      className="w-48 min-w-0 truncate bg-transparent font-semibold outline-none sm:w-64"
      value={title}
      onChange={(e) => setTitle(e.target.value)}
      onBlur={saveHeader}
    />
    <input
      type="number"
      className="w-14 shrink-0 rounded border border-border bg-paper px-2 py-1 text-sm"
      value={timeLimit}
      onChange={(e) => setTimeLimit(e.target.value === "" ? "" : Number(e.target.value))}
      onBlur={saveHeader}
      placeholder="min"
    />
  </div>

<div className="flex shrink-0 items-center gap-3">
  {savedAt && <span className="hidden text-xs text-ink-soft sm:inline">Saved {savedAt.toLocaleTimeString()}</span>}
  <button className="btn-outline px-4 py-2 text-sm" onClick={() => setShowPreview(true)}>
    Preview
  </button>
  <button
    className="btn-outline px-4 py-2 text-sm"
    disabled={saving}
    onClick={() => setSaveTrigger((n) => n + 1)}
  >
    {saving ? "Saving…" : "Save"}
  </button>
  <button className="btn-primary px-4 py-2 text-sm" onClick={() => setShowShare(true)}>
    {status === "published" ? "Share" : "Publish"}
  </button>
</div>
      </header>

    <BlockEditor
      key={`${initialQuestions.length}-${initialPassages.length}`}
      examId={exam.id}
      examTitle={title}
      timeLimitMinutes={timeLimit === "" ? null : Number(timeLimit)}
      initialQuestions={initialQuestions}
      initialPassages={initialPassages}
      externalShowPreview={showPreview}
      onClosePreview={() => setShowPreview(false)}
      externalSaveTrigger={saveTrigger}
      onSavingChange={setSaving}
      onSaved={() => setSavedAt(new Date())}
    />

      {showShare && (
        <SharePopup
          examId={exam.id}
          slug={exam.share_slug}
          settings={settings}
          status={status}
          onClose={() => setShowShare(false)}
          onPublished={() => setStatus("published")}
        />
      )}
    </div>
  );
}
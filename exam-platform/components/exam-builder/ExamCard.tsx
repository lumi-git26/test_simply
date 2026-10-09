"use client";

import { useState } from "react";
import Link from "next/link";
import { ExamSettings } from "@/lib/types";
import { SharePopup } from "@/components/exam-builder/SharePopup";

export function ExamCard({
  exam,
  settings,
  onTagsChange,
}: {
  exam: { id: string; title: string; status: string; share_slug: string; created_at: string; tags: string[] };
  settings: ExamSettings;
  onTagsChange: (id: string, tags: string[]) => void;
}) {
  const [showShare, setShowShare] = useState(false);
  const [status, setStatus] = useState(exam.status);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");

  const tags = exam.tags ?? [];

  async function saveTags(next: string[]) {
    onTagsChange(exam.id, next); // optimistic
    await fetch(`/api/exams/${exam.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tags: next }),
    });
  }

  function addTag() {
    const t = draft.trim();
    setDraft("");
    setAdding(false);
    if (!t || tags.some((x) => x.toLowerCase() === t.toLowerCase())) return;
    saveTags([...tags, t]);
  }

  return (
    <>
      <div className="rounded-card bg-paper-dark px-6 py-5">
        <div className="flex items-center justify-between">
          <Link href={`/dashboard/${exam.id}/edit`} className="min-w-0 flex-1">
            <p className="font-semibold">{exam.title}</p>
            <p className="text-sm text-ink-soft">
              /{exam.share_slug} — {status === "published" ? "Published" : "Draft"}
            </p>
          </Link>

          <div className="flex items-center gap-3">
            <button onClick={() => setShowShare(true)} className="btn-outline px-4 py-2 text-sm">
              Share
            </button>
            <Link href={`/dashboard/${exam.id}/edit`} className="text-ink-soft">
              →
            </Link>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {tags.map((t) => (
            <span
              key={t}
              className="flex items-center gap-1 rounded-md bg-paper px-2 py-0.5 text-xs text-ink-soft"
            >
              {t}
              <button
                onClick={() => saveTags(tags.filter((x) => x !== t))}
                className="text-ink-soft/60 hover:text-red-600"
                aria-label={`Remove tag ${t}`}
              >
                ✕
              </button>
            </span>
          ))}

          {adding ? (
            <input
              autoFocus
              className="w-28 rounded-md border border-border bg-paper px-2 py-0.5 text-xs outline-none"
              placeholder="tag name"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") addTag();
                if (e.key === "Escape") { setDraft(""); setAdding(false); }
              }}
              onBlur={addTag}
            />
          ) : (
            <button
              onClick={() => setAdding(true)}
              className="rounded-md border border-dashed border-border px-2 py-0.5 text-xs text-ink-soft hover:border-ink hover:text-ink"
            >
              + Tag
            </button>
          )}
        </div>
      </div>

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
    </>
  );
}
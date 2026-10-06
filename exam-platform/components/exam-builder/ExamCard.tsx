"use client";

import { useState } from "react";
import Link from "next/link";
import { ExamSettings } from "@/lib/types";
import { SharePopup } from "@/components/exam-builder/SharePopup";

export function ExamCard({
  exam,
  settings,
}: {
  exam: { id: string; title: string; status: string; share_slug: string; created_at: string };
  settings: ExamSettings;
}) {
  const [showShare, setShowShare] = useState(false);
  const [status, setStatus] = useState(exam.status);

  return (
    <>
      <div className="flex items-center justify-between rounded-card bg-paper-dark px-6 py-5">
        <Link href={`/dashboard/${exam.id}/edit`} className="min-w-0 flex-1">
          <p className="font-semibold">{exam.title}</p>
          <p className="text-sm text-ink-soft">
            /{exam.share_slug} — {status === "published" ? "Published" : "Draft"}
          </p>
        </Link>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowShare(true)}
            className="btn-outline px-4 py-2 text-sm"
          >
            Share
          </button>
          <Link href={`/dashboard/${exam.id}/edit`} className="text-ink-soft">
            →
          </Link>
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
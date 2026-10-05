"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Exam, ExamSettings, Question, Passage } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { BlockEditor } from "@/components/exam-builder/BlockEditor";
import { ExcelImport } from "@/components/exam-builder/ExcelImport";
import { PdfImport } from "@/components/exam-builder/PdfImport";
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
  const router = useRouter();
  const [title, setTitle] = useState(exam.title);
  const [timeLimit, setTimeLimit] = useState(exam.time_limit_minutes ?? "");
  const [status, setStatus] = useState(exam.status);
  const [showShare, setShowShare] = useState(false);

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
    <main className="min-h-screen px-6 py-10 pb-28 md:px-16">
      {/* Header: Tiêu đề & Thời gian làm bài */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <input
          className="input-field max-w-md text-xl font-bold"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={saveHeader}
        />
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-ink-soft">
            Thời gian (phút):
            <input
              type="number"
              className="input-field w-24"
              value={timeLimit}
              onChange={(e) => setTimeLimit(e.target.value === "" ? "" : Number(e.target.value))}
              onBlur={saveHeader}
            />
          </label>
        </div>
      </div>

      {/* 1. Import Excel / PDF - Đặt lên TRÊN CÙNG */}
      <div className="mb-8 grid gap-6 md:grid-cols-2">
        <ExcelImport examId={exam.id} onImported={() => router.refresh()} />
        <PdfImport examId={exam.id} onImported={() => router.refresh()} />
      </div>

      {/* 2. Danh sách block (Reading/Instruction/Question) - Ở GIỮA */}
      <div>
        <BlockEditor
          key={`${initialQuestions.length}-${initialPassages.length}`}
          examId={exam.id}
          initialQuestions={initialQuestions}
          initialPassages={initialPassages}
          publishButton={
            <Button onClick={() => setShowShare(true)}>
              {status === "published" ? "Share / Settings" : "Publish"}
            </Button>
          }
        />
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
    </main>
  );
}
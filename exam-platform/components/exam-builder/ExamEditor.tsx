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
    <main className="min-h-screen bg-slate-50/50 px-4 py-8 pb-32 md:px-8">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header: Tên bài thi & Thời gian */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition-all hover:shadow-md">
          <input
            className="flex-1 bg-transparent text-xl font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none"
            placeholder="Nhập tên bài kiểm tra..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={saveHeader}
          />
          <div className="flex items-center gap-2 rounded-xl bg-slate-100/80 px-3 py-1.5 text-xs font-medium text-slate-600">
            <span>⏱️ Thời gian:</span>
            <input
              type="number"
              className="w-16 rounded-lg border border-slate-200 bg-white px-2 py-1 text-center font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400"
              value={timeLimit}
              onChange={(e) => setTimeLimit(e.target.value === "" ? "" : Number(e.target.value))}
              onBlur={saveHeader}
            />
            <span>phút</span>
          </div>
        </div>

        {/* 1. Import Excel / PDF - Đặt lên TRÊN CÙNG (Compact Card) */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 text-[11px] font-bold text-indigo-700">
                1
              </span>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Nhập đề từ file (Excel / PDF)
              </h3>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <ExcelImport examId={exam.id} onImported={() => router.refresh()} />
            <PdfImport examId={exam.id} onImported={() => router.refresh()} />
          </div>
        </div>

        {/* 2. Danh sách block & 3. Floating Actions */}
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
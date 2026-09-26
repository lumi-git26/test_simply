"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Exam, ExamSettings, Question } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { QuestionForm } from "@/components/exam-builder/QuestionForm";
import { ExcelImport } from "@/components/exam-builder/ExcelImport";
import { SharePopup } from "@/components/exam-builder/SharePopup";
import { PdfImport } from "@/components/exam-builder/PdfImport";

export function ExamEditor({
  exam,
  settings,
  initialQuestions,
}: {
  exam: Exam;
  settings: ExamSettings;
  initialQuestions: Question[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState(exam.title);
  const [timeLimit, setTimeLimit] = useState(exam.time_limit_minutes ?? "");
  const [status, setStatus] = useState(exam.status);
  const [questions, setQuestions] = useState(initialQuestions);

  useEffect(() => {
    setQuestions(initialQuestions);
  }, [initialQuestions]);

  const [showShare, setShowShare] = useState(false);
  const [savingHeader, setSavingHeader] = useState(false);

  async function saveHeader() {
    setSavingHeader(true);
    await fetch(`/api/exams/${exam.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        time_limit_minutes: timeLimit === "" ? null : Number(timeLimit),
      }),
    });
    setSavingHeader(false);
  }

  async function addQuestion(q: any) {
    const res = await fetch(`/api/exams/${exam.id}/questions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(q),
    });
    const created = await res.json();
    setQuestions((prev) => [...prev, created]);
  }

  async function deleteQuestion(id: string) {
    await fetch(`/api/exams/${exam.id}/questions/${id}`, { method: "DELETE" });
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  }

  function refreshQuestions() {
    router.refresh();
  }

  return (
    <main className="min-h-screen px-6 py-10 md:px-16">
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
          <Button onClick={() => setShowShare(true)}>
            {status === "published" ? "Share / Settings" : "Publish"}
          </Button>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-[1fr_360px]">
        <div>
          <h2 className="mb-4 text-lg font-bold">
            Câu hỏi ({questions.length})
          </h2>
          <div className="mb-6 space-y-3">
            {questions.map((q, i) => (
              <div
                key={q.id}
                className="flex items-start justify-between rounded-card border border-border p-4"
              >
                <div>
                  <p className="text-sm text-ink-soft">
                    #{i + 1} · Part {q.part} · {q.question_type}
                  </p>
                  <p className="mt-1">{q.question_text}</p>
                </div>
                <button
                  className="text-sm text-red-600 hover:underline"
                  onClick={() => deleteQuestion(q.id)}
                >
                  Xoá
                </button>
              </div>
            ))}
            {!questions.length && (
              <p className="text-ink-soft">Chưa có câu hỏi nào — thêm thủ công hoặc import Excel.</p>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <QuestionForm onAdd={addQuestion} />
          <ExcelImport examId={exam.id} onImported={refreshQuestions} />
          <PdfImport examId={exam.id} onImported={refreshQuestions} />
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
    </main>
  );
}

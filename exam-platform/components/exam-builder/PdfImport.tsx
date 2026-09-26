"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

type Preview = {
  passages: { passage_id: string; title: string; body: string }[];
  questions: {
    part: number;
    question_type: string;
    question_text: string;
    correct_answer: string;
  }[];
};

export function PdfImport({ examId, onImported }: { examId: string; onImported: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function extract() {
    if (!file) return;
    setLoading(true);
    setError(null);
    setPreview(null);
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`/api/exams/${examId}/import-pdf`, { method: "POST", body: formData });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Trích xuất thất bại");
      return;
    }
    setPreview(data);
  }

  async function confirm() {
    if (!preview) return;
    setConfirming(true);
    const res = await fetch(`/api/exams/${examId}/import-pdf/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(preview),
    });
    setConfirming(false);
    if (!res.ok) {
      setError("Lưu thất bại, thử lại.");
      return;
    }
    setPreview(null);
    setFile(null);
    onImported();
  }

  return (
    <div className="rounded-card border border-border p-5">
      <p className="mb-3 font-semibold">Import từ PDF (AI tự tách câu hỏi)</p>
      <p className="mb-3 text-sm text-ink-soft">
        Upload PDF đề thi — Gemini sẽ đọc và tách câu hỏi. Cậu luôn xem trước và xác nhận trước khi lưu vào bài kiểm tra.
      </p>

      {!preview && (
        <>
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="mb-3 block"
          />
          <Button onClick={extract} disabled={!file || loading}>
            {loading ? "AI đang đọc PDF…" : "Trích xuất câu hỏi"}
          </Button>
        </>
      )}

      {error && <p className="mt-3 text-sm text-red-700">{error}</p>}

      {preview && (
        <div className="mt-2">
          <p className="mb-3 text-sm">
            AI tìm thấy <strong>{preview.questions.length}</strong> câu hỏi
            {preview.passages.length > 0 && <> và {preview.passages.length} đoạn Reading</>}. Xem lại
            trước khi lưu:
          </p>
          <div className="mb-4 max-h-64 space-y-2 overflow-y-auto rounded border border-border p-3">
            {preview.questions.map((q, i) => (
              <div key={i} className="text-sm">
                <span className="text-ink-soft">
                  #{i + 1} · Part {q.part} · {q.question_type} ·{" "}
                </span>
                {q.question_text}
                <span className="text-ink-soft"> → {q.correct_answer}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <Button onClick={confirm} disabled={confirming}>
              {confirming ? "Đang lưu…" : `Xác nhận, thêm ${preview.questions.length} câu`}
            </Button>
            <Button variant="outline" onClick={() => setPreview(null)}>
              Huỷ
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
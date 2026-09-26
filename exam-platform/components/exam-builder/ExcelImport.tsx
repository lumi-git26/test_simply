"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function ExcelImport({ examId, onImported }: { examId: string; onImported: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [success, setSuccess] = useState<string | null>(null);

  async function upload() {
    if (!file) return;
    setLoading(true);
    setErrors([]);
    setSuccess(null);
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`/api/exams/${examId}/import-excel`, {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setErrors(data.details ?? [data.error ?? "Import thất bại"]);
      return;
    }
    setSuccess(`Đã import ${data.imported} câu hỏi (${data.passages} đoạn Reading).`);
    onImported();
  }

  return (
    <div className="rounded-card border border-border p-5">
      <p className="mb-3 font-semibold">Import từ Excel</p>
      <p className="mb-3 text-sm text-ink-soft">
        Dùng đúng template (sheet "Passages" + "Questions"). Xoá các hàng ví dụ trước khi upload.
      </p>
      <input
        type="file"
        accept=".xlsx"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        className="mb-3 block"
      />
      <Button onClick={upload} disabled={!file || loading}>
        {loading ? "Đang import…" : "Import"}
      </Button>

      {success && <p className="mt-3 text-sm text-green-700">{success}</p>}
      {errors.length > 0 && (
        <ul className="mt-3 list-disc pl-5 text-sm text-red-700">
          {errors.map((e, i) => (
            <li key={i}>{e}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

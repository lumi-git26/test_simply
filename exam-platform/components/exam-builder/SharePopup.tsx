"use client";

import { useState } from "react";
import { ExamSettings } from "@/lib/types";
import { Button } from "@/components/ui/Button";

export function SharePopup({
  examId,
  slug,
  settings,
  status,
  onClose,
  onPublished,
}: {
  examId: string;
  slug: string;
  settings: ExamSettings;
  status: string;
  onClose: () => void;
  onPublished: () => void;
}) {
  const [local, setLocal] = useState(settings);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const link =
    typeof window !== "undefined" ? `${window.location.origin}/exam/${slug}` : `/exam/${slug}`;

  async function save() {
    setSaving(true);
    await fetch(`/api/exams/${examId}/settings`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(local),
    });
    if (status !== "published") {
      await fetch(`/api/exams/${examId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "published" }),
      });
      onPublished();
    }
    setSaving(false);
    onClose();
  }

  function copyLink() {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-card bg-paper p-6">
        <h2 className="mb-4 text-xl font-bold">Chia sẻ bài kiểm tra</h2>

        <div className="mb-6 flex gap-2">
          <input className="input-field" readOnly value={link} />
          <Button variant="outline" onClick={copyLink}>
            {copied ? "Đã copy" : "Copy"}
          </Button>
        </div>

        <div className="space-y-4">
          <label className="flex items-center justify-between">
            <span>Hiện kết quả ngay sau khi nộp</span>
            <input
              type="checkbox"
              checked={local.show_result_instantly}
              onChange={(e) => setLocal({ ...local, show_result_instantly: e.target.checked })}
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm text-ink-soft">Hạn nộp (để trống = không giới hạn)</span>
            <input
              type="datetime-local"
              className="input-field"
              value={local.due_at ? local.due_at.slice(0, 16) : ""}
              onChange={(e) =>
                setLocal({ ...local, due_at: e.target.value ? new Date(e.target.value).toISOString() : null })
              }
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm text-ink-soft">
              Số lần làm bài (để trống = không giới hạn)
            </span>
            <input
              type="number"
              min={1}
              className="input-field"
              value={local.max_attempts ?? ""}
              onChange={(e) =>
                setLocal({ ...local, max_attempts: e.target.value ? Number(e.target.value) : null })
              }
            />
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Đóng
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? "Đang lưu…" : status === "published" ? "Lưu setting" : "Lưu & Publish"}
          </Button>
        </div>
      </div>
    </div>
  );
}

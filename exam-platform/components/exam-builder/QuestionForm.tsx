"use client";

import { useState } from "react";
import { QuestionType } from "@/lib/types";
import { Button } from "@/components/ui/Button";

const TYPE_LABELS: Record<QuestionType, string> = {
  multiple_choice: "Multiple choice",
  fill_blank: "Fill in the blank",
  writing_rewrite: "Writing — Rewrite",
  writing_rearrange: "Writing — Rearrange",
  order: "Order (sắp xếp câu)",
};

export function QuestionForm({ onAdd }: { onAdd: (q: any) => Promise<void> }) {
  const [type, setType] = useState<QuestionType>("multiple_choice");
  const [text, setText] = useState("");
  const [options, setOptions] = useState({ A: "", B: "", C: "", D: "" });
  const [correct, setCorrect] = useState("");
  const [points, setPoints] = useState(1);
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!text.trim() || !correct.trim()) return;
    setSaving(true);
    await onAdd({
      question_type: type,
      question_text: text,
      options: type === "multiple_choice" ? options : null,
      correct_answer: correct,
      points,
    });
    setText("");
    setOptions({ A: "", B: "", C: "", D: "" });
    setCorrect("");
    setPoints(1);
    setSaving(false);
  }

  return (
    <div className="rounded-card border border-border p-5">
      <p className="mb-3 font-semibold">Thêm câu hỏi</p>

      <select
        className="input-field mb-3"
        value={type}
        onChange={(e) => setType(e.target.value as QuestionType)}
      >
        {Object.entries(TYPE_LABELS).map(([val, label]) => (
          <option key={val} value={val}>
            {label}
          </option>
        ))}
      </select>

      <textarea
        className="input-field mb-3"
        placeholder="Nội dung câu hỏi (dùng ___ cho fill_blank)"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      {type === "multiple_choice" && (
        <div className="mb-3 grid grid-cols-2 gap-2">
          {(["A", "B", "C", "D"] as const).map((k) => (
            <input
              key={k}
              className="input-field"
              placeholder={`Option ${k}`}
              value={options[k]}
              onChange={(e) => setOptions({ ...options, [k]: e.target.value })}
            />
          ))}
        </div>
      )}

      <div className="mb-3 flex gap-3">
        <input
          className="input-field flex-1"
          placeholder={
            type === "multiple_choice" ? "Đáp án đúng (A/B/C/D)" : "Đáp án mẫu (cách nhau bởi ;)"
          }
          value={correct}
          onChange={(e) => setCorrect(e.target.value)}
        />
        <input
          type="number"
          className="input-field w-24"
          value={points}
          onChange={(e) => setPoints(Number(e.target.value))}
        />
      </div>

      <Button onClick={submit} disabled={saving}>
        {saving ? "Đang thêm…" : "Thêm câu hỏi"}
      </Button>
    </div>
  );
}

"use client";

import { QuestionBlockData } from "@/lib/blocks";
import { QuestionType } from "@/lib/types";

const TYPE_LABELS: Record<QuestionType, string> = {
  multiple_choice: "Multiple choice",
  fill_blank: "Fill in the blank",
  order: "Order (sắp xếp câu)",
  writing_rewrite: "Writing — Rewrite",
  writing_rearrange: "Writing — Rearrange",
};

export function QuestionBlockCard({
  index,
  data,
  readingOptions,
  passageBlockId,
  onChangePassage,
  onChange,
  onDelete,
}: {
  index: number;
  data: QuestionBlockData;
  readingOptions: { id: string; label: string }[];
  passageBlockId: string | null;
  onChangePassage: (id: string | null) => void;
  onChange: (data: QuestionBlockData) => void;
  onDelete: () => void;
}) {
  function setOption(key: "A" | "B" | "C" | "D", val: string) {
    onChange({ ...data, options: { ...data.options, [key]: val } });
  }

  return (
    <div className="group rounded-card bg-paper-dark p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-ink-soft">
          <span className="cursor-grab select-none">⠿</span>
          <span>Question {index + 1}:</span>
        </div>
        <div className="flex items-center gap-2">
          <select
            className="rounded-full border border-border bg-paper px-3 py-1 text-sm"
            value={data.question_type}
            onChange={(e) => onChange({ ...data, question_type: e.target.value as QuestionType })}
          >
            {Object.entries(TYPE_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
          <button
            onClick={onDelete}
            className="opacity-0 group-hover:opacity-100 text-sm text-red-600 transition"
          >
            Xoá
          </button>
        </div>
      </div>

      {readingOptions.length > 0 && (
        <select
          className="input-field mb-3 text-sm"
          value={passageBlockId ?? ""}
          onChange={(e) => onChangePassage(e.target.value || null)}
        >
          <option value="">Không thuộc đoạn Reading nào (Part 1)</option>
          {readingOptions.map((r) => (
            <option key={r.id} value={r.id}>Thuộc: {r.label || "(đoạn Reading chưa đặt tên)"}</option>
          ))}
        </select>
      )}

      <textarea
        className="input-field mb-3"
        placeholder={
          data.question_type === "multiple_choice"
            ? "Nội dung câu hỏi — để trống nếu là câu trọng âm/phát âm (đề bài đã nằm trong Instruction block phía trên)"
            : "Nội dung câu hỏi (dùng ___ cho chỗ trống nếu là fill in the blank)"
        }
        value={data.question_text}
        onChange={(e) => onChange({ ...data, question_text: e.target.value })}
      />

      <details className="mb-3">
        <summary className="cursor-pointer text-sm text-ink-soft">+ Thêm context (hội thoại/tình huống dẫn nhập)</summary>
        <input
          className="input-field mt-2 text-sm"
          placeholder="VD: Linh is walking home. Her friend, Nam, offers a ride."
          value={data.context}
          onChange={(e) => onChange({ ...data, context: e.target.value })}
        />
      </details>

      {data.question_type === "multiple_choice" && (
        <div className="grid grid-cols-2 gap-3">
          {(["A", "B", "C", "D"] as const).map((key) => (
            <div
              key={key}
              className="flex items-center gap-2 rounded-lg border border-border bg-paper px-3 py-2"
            >
              <span className="font-bold">{key}</span>
              <input
                className="flex-1 bg-transparent outline-none"
                value={data.options[key]}
                onChange={(e) => setOption(key, e.target.value)}
              />
              <button
                type="button"
                onClick={() => onChange({ ...data, correct_letter: key })}
                title="Đánh dấu đáp án đúng"
                className={`h-5 w-5 shrink-0 rounded-full border-2 transition
                  ${data.correct_letter === key ? "border-ink bg-ink" : "border-blue-300 bg-blue-100"}`}
              />
            </div>
          ))}
        </div>
      )}

      {data.question_type === "fill_blank" && (
        <input
          className="input-field"
          placeholder="Đáp án đúng (nhiều đáp án cách nhau bởi ;)"
          value={data.fill_answer}
          onChange={(e) => onChange({ ...data, fill_answer: e.target.value })}
        />
      )}

      {data.question_type === "order" && (
        <div className="space-y-2">
          <p className="text-xs text-ink-soft">Nhập các câu/mệnh đề theo ĐÚNG thứ tự — hệ thống sẽ tự xáo trộn khi hiển thị cho học sinh.</p>
          {data.order_items.map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink text-xs text-paper">
                {i + 1}
              </span>
              <input
                className="input-field flex-1"
                value={item}
                onChange={(e) => {
                  const next = [...data.order_items];
                  next[i] = e.target.value;
                  onChange({ ...data, order_items: next });
                }}
              />
              <button
                type="button"
                disabled={data.order_items.length <= 2}
                onClick={() => onChange({ ...data, order_items: data.order_items.filter((_, idx) => idx !== i) })}
                className="text-red-600 disabled:opacity-30"
              >
                ✕
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => onChange({ ...data, order_items: [...data.order_items, ""] })}
            className="text-sm text-ink-soft hover:text-ink"
          >
            + Thêm câu
          </button>
        </div>
      )}

      {(data.question_type === "writing_rewrite" || data.question_type === "writing_rearrange") && (
        <input
          className="input-field"
          placeholder="Câu mẫu đúng (nhiều đáp án chấp nhận được cách nhau bởi ;)"
          value={data.writing_answers}
          onChange={(e) => onChange({ ...data, writing_answers: e.target.value })}
        />
      )}

      <div className="mt-3 flex items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-ink-soft">
          Điểm:
          <input
            type="number"
            min={0.5}
            step={0.5}
            className="input-field w-20"
            value={data.points}
            onChange={(e) => onChange({ ...data, points: Number(e.target.value) })}
          />
        </label>
      </div>
    </div>
  );
}
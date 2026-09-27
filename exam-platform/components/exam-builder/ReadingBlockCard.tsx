"use client";

import { ReadingBlockData } from "@/lib/blocks";

export function ReadingBlockCard({
  data,
  onChange,
  onDelete,
}: {
  data: ReadingBlockData;
  onChange: (data: ReadingBlockData) => void;
  onDelete: () => void;
}) {
  return (
    <div className="group rounded-card bg-paper-dark p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-ink-soft">
          <span className="cursor-grab select-none">⠿</span>
          <span>▤ Reading passage</span>
        </div>
        <button
          onClick={onDelete}
          className="opacity-0 group-hover:opacity-100 text-sm text-red-600 transition"
        >
          Xoá
        </button>
      </div>
      <input
        className="input-field mb-3"
        placeholder="Tiêu đề đoạn văn (không bắt buộc)"
        value={data.title}
        onChange={(e) => onChange({ ...data, title: e.target.value })}
      />
      <textarea
        className="input-field min-h-[140px]"
        placeholder="Nội dung đoạn văn — các câu hỏi phía dưới có thể chọn gắn vào đoạn này"
        value={data.body}
        onChange={(e) => onChange({ ...data, body: e.target.value })}
      />
    </div>
  );
}
"use client";

import { RichTextField } from "@/components/exam-builder/RichTextField";

export function InstructionBlockCard({
  text,
  onChange,
  onDelete,
}: {
  text: string;
  onChange: (val: string) => void;
  onDelete: () => void;
}) {
  return (
    <div className="group rounded-card bg-paper-dark px-4 py-3">
      <div className="mb-1 flex items-center gap-3">
        <span className="cursor-grab select-none text-ink-soft/50">⠿</span>
        <span className="text-ink-soft">#</span>
        <button
          onClick={onDelete}
          className="ml-auto opacity-0 group-hover:opacity-100 text-sm text-red-600 transition"
        >
          Xoá
        </button>
      </div>
      <RichTextField
        placeholder="From question 1 to 4, choose the best answer to fill in the blank"
        value={text}
        onChange={onChange}
      />
    </div>
  );
}
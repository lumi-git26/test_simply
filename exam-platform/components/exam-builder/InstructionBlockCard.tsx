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
    <div className="group flex items-start gap-2 rounded-card bg-paper-dark px-3 py-2">
      <span className="mt-1.5 text-ink-soft">#</span>
      <div className="flex-1">
        <RichTextField placeholder="Instruction for the following questions" value={text} onChange={onChange} />
      </div>
      <button onClick={onDelete} className="mt-1.5 opacity-0 group-hover:opacity-100 text-sm text-red-600 transition">✕</button>
    </div>
  );
}
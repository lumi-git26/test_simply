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
    <div className="group rounded-card border border-border bg-paper-dark p-4">
      <div className="mb-2 flex items-center justify-between text-sm text-ink-soft">
        <span>▤ Passage</span>
        <button onClick={onDelete} className="opacity-0 group-hover:opacity-100 text-red-600 transition">✕</button>
      </div>
      <input
        className="input-field mb-2"
        placeholder="Title (optional)"
        value={data.title}
        onChange={(e) => onChange({ ...data, title: e.target.value })}
      />
      <textarea
        className="input-field min-h-[100px]"
        placeholder="Passage text"
        value={data.body}
        onChange={(e) => onChange({ ...data, body: e.target.value })}
      />
    </div>
  );
}
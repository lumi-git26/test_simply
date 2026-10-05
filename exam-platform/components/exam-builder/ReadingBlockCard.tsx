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
    <div className="rounded-card bg-paper-dark p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="cursor-grab select-none text-ink-soft/50">⠿</span>
          <span className="font-semibold">Passage</span>
        </div>
        <button onClick={onDelete} className="text-ink-soft hover:text-red-600">✕</button>
      </div>
      <div className="mb-2 rounded-md bg-paper px-4 py-2">
        <input
          className="w-full bg-transparent outline-none placeholder:text-ink-soft/50"
          placeholder="Title (optional)"
          value={data.title}
          onChange={(e) => onChange({ ...data, title: e.target.value })}
        />
      </div>
      <div className="rounded-md bg-paper px-4 py-3">
        <textarea
          className="min-h-[100px] w-full resize-y bg-transparent outline-none placeholder:text-ink-soft/50"
          placeholder="Passage text"
          value={data.body}
          onChange={(e) => onChange({ ...data, body: e.target.value })}
        />
      </div>
    </div>
  );
}
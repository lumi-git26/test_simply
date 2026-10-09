"use client";

import { ReadingBlockData } from "@/lib/blocks";

export function ReadingBlockCard({
  label,
  data,
  onChange,
  onDelete,
}: {
  label: string;
  data: ReadingBlockData;
  onChange: (data: ReadingBlockData) => void;
  onDelete: () => void;
}) {
  return (
    <div className="rounded-card bg-paper-dark p-5">
      <div className="mb-3 flex items-center justify-between">
        <span className="font-semibold">{label}</span>
        <button onClick={onDelete} className="text-sm text-ink-soft hover:text-red-600">
          Delete part
        </button>
      </div>
      <div className="mb-2 rounded-md bg-paper px-4 py-2">
        <input
          className="w-full bg-transparent outline-none placeholder:text-ink-soft/50"
          placeholder="Passage title (optional)"
          value={data.title}
          onChange={(e) => onChange({ ...data, title: e.target.value })}
        />
      </div>
      <div className="rounded-md bg-paper px-4 py-3">
        <textarea
          className="min-h-[140px] w-full resize-y bg-transparent outline-none placeholder:text-ink-soft/50"
          placeholder="Passage text"
          value={data.body}
          onChange={(e) => onChange({ ...data, body: e.target.value })}
        />
      </div>
    </div>
  );
}
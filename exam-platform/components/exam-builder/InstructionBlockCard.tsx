"use client";

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
    <div className="group flex items-center gap-3 rounded-card bg-paper-dark px-4 py-3">
      <span className="cursor-grab select-none text-ink-soft/50">⠿</span>
      <span className="text-ink-soft">#</span>
      <input
        className="flex-1 bg-transparent italic font-semibold outline-none"
        placeholder="From question 1 to 4, choose the best answer to fill in the blank"
        value={text}
        onChange={(e) => onChange(e.target.value)}
      />
      <button
        onClick={onDelete}
        className="opacity-0 group-hover:opacity-100 text-sm text-red-600 transition"
      >
        Xoá
      </button>
    </div>
  );
}
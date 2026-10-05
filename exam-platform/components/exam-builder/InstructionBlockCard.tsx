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
    <div className="group flex items-center gap-2 rounded-card bg-paper-dark px-3 py-2.5">
      <span className="text-ink-soft">#</span>
      <input
        className="flex-1 bg-transparent italic outline-none placeholder:text-ink-soft/50"
        placeholder="Type your instruction here"
        value={text}
        onChange={(e) => onChange(e.target.value)}
      />
      <button onClick={onDelete} className="opacity-0 group-hover:opacity-100 text-sm text-red-600 transition">✕</button>
    </div>
  );
}
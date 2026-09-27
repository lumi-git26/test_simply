"use client";

// mode "taking": xanh = đã trả lời, trắng = chưa trả lời.
// mode "review": xanh = đúng, đỏ = sai, trắng = không trả lời.
export function QuestionNavigator({
  total,
  mode,
  answered,
  results,
  onJump,
}: {
  total: number;
  mode: "taking" | "review";
  answered?: Set<number>;
  results?: (boolean | null)[]; // only for mode="review"
  onJump: (index: number) => void;
}) {
  function colorFor(i: number) {
    if (mode === "review") {
      const r = results?.[i];
      if (r === true) return "bg-green-500 text-white border-green-500";
      if (r === false) return "bg-red-500 text-white border-red-500";
      return "bg-transparent text-paper border-paper/40";
    }
    const isAnswered = answered?.has(i);
    return isAnswered
      ? "bg-green-500 text-white border-green-500"
      : "bg-transparent text-paper border-paper/40";
  }

  return (
    <div className="rounded-card bg-ink p-6 text-paper">
      <p className="mb-4 text-lg font-semibold">Questions</p>
      <div className="grid grid-cols-4 gap-3 overflow-y-auto pr-1" style={{ maxHeight: "calc(100vh - 12rem)" }}>
        {Array.from({ length: total }, (_, i) => i).map((i) => (
          <button
            key={i}
            onClick={() => onJump(i)}
            className={`flex h-14 w-14 items-center justify-center rounded-full border text-lg font-bold transition ${colorFor(i)}`}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {mode === "review" && (
        <div className="mt-4 flex gap-4 text-xs text-paper/70">
          <span className="flex items-center gap-1">
            <span className="h-3 w-3 rounded-full bg-green-500" /> Đúng
          </span>
          <span className="flex items-center gap-1">
            <span className="h-3 w-3 rounded-full bg-red-500" /> Sai
          </span>
        </div>
      )}
    </div>
  );
}
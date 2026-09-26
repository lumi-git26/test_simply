"use client";

export function QuestionNavigator({
  total,
  current,
  answered,
  onJump,
}: {
  total: number;
  current: number;
  answered: Set<number>;
  onJump: (index: number) => void;
}) {
  return (
    <div className="rounded-card bg-ink p-6 text-paper">
      <p className="mb-4 text-lg font-semibold">Questions</p>
      <div className="grid grid-cols-4 gap-3">
        {Array.from({ length: total }, (_, i) => i + 1).map((n) => {
          const isCurrent = n - 1 === current;
          const isAnswered = answered.has(n - 1);
          return (
            <button
              key={n}
              onClick={() => onJump(n - 1)}
              className={`flex h-14 w-14 items-center justify-center rounded-full text-lg font-bold transition
                ${isCurrent ? "bg-paper text-ink ring-2 ring-paper" : ""}
                ${!isCurrent && isAnswered ? "bg-paper/90 text-ink" : ""}
                ${!isCurrent && !isAnswered ? "bg-transparent text-paper border border-paper/40" : ""}
              `}
            >
              {n}
            </button>
          );
        })}
      </div>
    </div>
  );
}

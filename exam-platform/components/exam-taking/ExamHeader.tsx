"use client";

export function ExamHeader({
  title,
  timeText,
  low,
  floating,
}: {
  title: string;
  timeText: string | null;
  low?: boolean;
  floating?: boolean;
}) {
  return (
    <div
      className={
        floating
          ? "flex flex-col items-center py-4 backdrop-blur-md bg-paper/60"
          : "flex flex-col items-center py-2"
      }
    >
      <h1 className="text-2xl font-bold">{title}</h1>
      {timeText && (
        <p className={`mt-1 text-lg ${low ? "text-red-500" : "text-ink-soft"}`}>
          Time left: {timeText}
        </p>
      )}
    </div>
  );
}
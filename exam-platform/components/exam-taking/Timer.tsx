"use client";

import { useEffect, useState } from "react";

// Counts down from a fixed deadline (startedAt + limitMinutes), computed
// server-side, so a student can't cheat by changing their local clock.
export function Timer({
  deadline,
  onExpire,
}: {
  deadline: number; // epoch ms
  onExpire: () => void;
}) {
  const [remaining, setRemaining] = useState(deadline - Date.now());

  useEffect(() => {
    const id = setInterval(() => {
      const left = deadline - Date.now();
      setRemaining(left);
      if (left <= 0) {
        clearInterval(id);
        onExpire();
      }
    }, 1000);
    return () => clearInterval(id);
  }, [deadline, onExpire]);

  const total = Math.max(0, Math.floor(remaining / 1000));
  const mm = String(Math.floor(total / 60)).padStart(2, "0");
  const ss = String(total % 60).padStart(2, "0");

  return (
    <div className="flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-paper">
      <span>⏰</span>
      <span className="font-mono font-semibold">
        {mm}:{ss}
      </span>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";

// Counts down from a fixed deadline (epoch ms) computed server-side, so a
// student can't cheat by changing their local clock.
export function useCountdown(deadline: number | null, onExpire: () => void) {
  const [remaining, setRemaining] = useState(deadline ? deadline - Date.now() : 0);

  useEffect(() => {
    if (!deadline) return;
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
  return { mm, ss, low: total <= 60 };
}
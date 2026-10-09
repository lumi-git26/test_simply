"use client";

import { useLayoutEffect, useRef, useState } from "react";

const MAX = 32; // short passages get big text, capped so it stays readable
const MIN = 14; // below this the passage scrolls instead of shrinking further

export function FitPassage({ title, body }: { title: string | null; body: string }) {
  const areaRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState(20);

  useLayoutEffect(() => {
    const area = areaRef.current;
    const text = textRef.current;
    if (!area || !text) return;

    // Largest font size at which the whole passage fits the available height.
    function fit() {
      if (!area || !text) return;
      let s = MAX;
      text.style.fontSize = `${s}px`;
      while (s > MIN && text.scrollHeight > area.clientHeight) {
        s -= 1;
        text.style.fontSize = `${s}px`;
      }
      setSize(s);
    }

    fit();
    // Re-fit whenever the pane changes width (window resize, panel expanding).
    const ro = new ResizeObserver(fit);
    ro.observe(area);
    return () => ro.disconnect();
  }, [title, body]);

  return (
    <div className="flex h-[60vh] flex-col rounded-card border border-border bg-paper p-6 md:h-[calc(100vh-7rem)]">
      {title && <h2 className="mb-4 shrink-0 text-xl font-bold">{title}</h2>}
      <div ref={areaRef} className="min-h-0 flex-1 overflow-y-auto">
        <div
          ref={textRef}
          lang="en"
          className="whitespace-pre-line leading-relaxed"
          style={{ fontSize: size, textAlign: "justify", hyphens: "auto" }}
        >
          {body}
        </div>
      </div>
    </div>
  );
}
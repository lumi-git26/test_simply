"use client";

import { useState, useRef, useEffect } from "react";

export function AddBlockMenu({
  onAdd,
}: {
  onAdd: (type: "question" | "instruction") => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-center gap-1 rounded-md border border-dashed border-border py-2 text-sm text-ink-soft hover:border-ink hover:text-ink"
      >
        + Add
      </button>

      {open && (
        <div className="absolute left-0 top-11 z-20 w-40 overflow-hidden rounded-md border border-border bg-paper shadow-lg">
          <button
            onClick={() => { onAdd("question"); setOpen(false); }}
            className="block w-full px-3 py-2 text-left text-sm hover:bg-paper-dark"
          >
            Question
          </button>
          <button
            onClick={() => { onAdd("instruction"); setOpen(false); }}
            className="block w-full px-3 py-2 text-left text-sm hover:bg-paper-dark"
          >
            Instruction
          </button>
        </div>
      )}
    </div>
  );
}
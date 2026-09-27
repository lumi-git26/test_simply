"use client";

import { useState, useRef, useEffect } from "react";

export function AddBlockMenu({
  onAdd,
}: {
  onAdd: (type: "question" | "reading" | "instruction") => void;
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
    <div ref={ref} className="relative flex justify-center py-2">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-paper text-xl leading-none hover:opacity-90"
        aria-label="Add block"
      >
        +
      </button>

      {open && (
        <div className="absolute top-11 z-20 w-56 overflow-hidden rounded-card border border-border bg-paper shadow-lg">
          <MenuItem icon="?" label="Question" onClick={() => { onAdd("question"); setOpen(false); }} />
          <MenuItem icon="▤" label="Reading" onClick={() => { onAdd("reading"); setOpen(false); }} />
          <MenuItem icon="¶" label="Instruction" onClick={() => { onAdd("instruction"); setOpen(false); }} />
          <div className="flex items-center gap-3 px-4 py-3 text-ink-soft/50 cursor-not-allowed">
            <span className="w-5 text-center">▦</span>
            <span>Diagram (sắp có)</span>
          </div>
        </div>
      )}
    </div>
  );
}

function MenuItem({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-paper-dark"
    >
      <span className="w-5 text-center">{icon}</span>
      <span>{label}</span>
    </button>
  );
}
"use client";

import { useRef, useState, useEffect } from "react";

export function RichTextField({
  value,
  onChange,
  placeholder,
  multiline,
}: {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  multiline?: boolean;
}) {
  const ref = useRef<any>(null);
  const [hasSelection, setHasSelection] = useState(false);

  function checkSelection() {
    const el = ref.current;
    if (!el) return;
    setHasSelection((el.selectionEnd ?? 0) > (el.selectionStart ?? 0));
  }

  // Hide the toolbar as soon as focus leaves the field, with a tiny delay
  // so a click on the toolbar button itself isn't missed.
  function onBlur() {
    setTimeout(() => setHasSelection(false), 150);
  }

  function wrap(marker: string) {
    const el = ref.current;
    if (!el) return;
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    if (end <= start) return; // no selection, nothing to wrap
    const before = value.slice(0, start);
    const selected = value.slice(start, end);
    const after = value.slice(end);
    onChange(`${before}${marker}${selected}${marker}${after}`);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + marker.length, start + marker.length + selected.length);
    });
  }

  const Field: any = multiline ? "textarea" : "input";

  return (
    <div className="relative">
      {hasSelection && (
        <div className="absolute -top-10 left-0 z-10 flex gap-1 rounded-lg border border-border bg-ink p-1 shadow-lg">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()} // keep textarea selection intact
            onClick={() => wrap("**")}
            className="flex h-7 w-7 items-center justify-center rounded text-xs font-bold text-paper hover:bg-paper/20"
          >
            B
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => wrap("*")}
            className="flex h-7 w-7 items-center justify-center rounded text-xs italic text-paper hover:bg-paper/20"
          >
            I
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => wrap("__")}
            className="flex h-7 w-7 items-center justify-center rounded text-xs underline text-paper hover:bg-paper/20"
          >
            U
          </button>
        </div>
      )}
      <Field
        ref={ref}
        className={`input-field ${multiline ? "min-h-[80px]" : ""}`}
        placeholder={placeholder}
        value={value}
        onChange={(e: any) => onChange(e.target.value)}
        onSelect={checkSelection}
        onMouseUp={checkSelection}
        onKeyUp={checkSelection}
        onBlur={onBlur}
      />
    </div>
  );
}
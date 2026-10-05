"use client";

import { useRef } from "react";

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

  function wrap(marker: string) {
    const el = ref.current;
    if (!el) return;
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    const before = value.slice(0, start);
    const selected = value.slice(start, end) || "text";
    const after = value.slice(end);
    onChange(`${before}${marker}${selected}${marker}${after}`);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + marker.length, start + marker.length + selected.length);
    });
  }

  const Field: any = multiline ? "textarea" : "input";

  return (
    <div>
      <div className="mb-1 flex gap-1">
        <button type="button" onClick={() => wrap("**")} className="flex h-7 w-7 items-center justify-center rounded border border-border text-xs font-bold hover:bg-paper-dark">B</button>
        <button type="button" onClick={() => wrap("*")} className="flex h-7 w-7 items-center justify-center rounded border border-border text-xs italic hover:bg-paper-dark">I</button>
        <button type="button" onClick={() => wrap("__")} className="flex h-7 w-7 items-center justify-center rounded border border-border text-xs underline hover:bg-paper-dark">U</button>
      </div>
      <Field
        ref={ref}
        className={`input-field ${multiline ? "min-h-[80px]" : ""}`}
        placeholder={placeholder}
        value={value}
        onChange={(e: any) => onChange(e.target.value)}
      />
    </div>
  );
}
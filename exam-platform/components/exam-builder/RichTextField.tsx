"use client";

import { useRef, useState } from "react";
import { toggleFormat, isSelectionWrapped } from "@/lib/richtext";

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
  const [selection, setSelection] = useState({ start: 0, end: 0 });

  function checkSelection() {
    const el = ref.current;
    if (!el) return;
    setSelection({ start: el.selectionStart ?? 0, end: el.selectionEnd ?? 0 });
  }

  function onBlur() {
    setTimeout(() => setSelection({ start: 0, end: 0 }), 150);
  }

  function toggle(kind: "bold" | "italic" | "underline") {
    const el = ref.current;
    if (!el) return;
    const { start, end } = selection;
    if (end <= start) return;
    const result = toggleFormat(value, start, end, kind);
    onChange(result.text);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(result.start, result.end);
      setSelection({ start: result.start, end: result.end });
    });
  }

  const hasSelection = selection.end > selection.start;
  const active = {
    bold: hasSelection && isSelectionWrapped(value, selection.start, selection.end, "bold"),
    italic: hasSelection && isSelectionWrapped(value, selection.start, selection.end, "italic"),
    underline: hasSelection && isSelectionWrapped(value, selection.start, selection.end, "underline"),
  };

  const Field: any = multiline ? "textarea" : "input";

  return (
    <div className="relative">
      {hasSelection && (
        <div className="absolute -top-9 left-0 z-10 flex gap-0.5 rounded-md border border-border bg-ink p-0.5 shadow-lg">
          <ToolbarButton active={active.bold} label="B" bold onMouseDown={() => toggle("bold")} />
          <ToolbarButton active={active.italic} label="I" italic onMouseDown={() => toggle("italic")} />
          <ToolbarButton active={active.underline} label="U" underline onMouseDown={() => toggle("underline")} />
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

function ToolbarButton({
  active,
  label,
  bold,
  italic,
  underline,
  onMouseDown,
}: {
  active: boolean;
  label: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  onMouseDown: () => void;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault(); // keep textarea selection intact
        onMouseDown();
      }}
      className={`flex h-6 w-6 items-center justify-center rounded text-xs text-paper transition
        ${bold ? "font-bold" : ""} ${italic ? "italic" : ""} ${underline ? "underline" : ""}
        ${active ? "bg-paper/30" : "hover:bg-paper/15"}
      `}
    >
      {label}
    </button>
  );
}
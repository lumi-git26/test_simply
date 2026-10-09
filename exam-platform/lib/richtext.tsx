import React from "react";

// Markdown subset: **bold**, *italic*, ++underline++ (nestable).
// Runs of 3+ underscores are blanks and are always rendered literally.
// Legacy "__underline__" is still read, but only when it wraps real text
// (no space right inside the markers), so "A __ B __ C" is left alone.
const TOKEN = /(_{3,}|\*\*.+?\*\*|\+\+.+?\+\+|__\S(?:.*?\S)?__|\*.+?\*)/g;

export function parseRichText(text: string): React.ReactNode {
  if (!text) return text;
  const nodes: React.ReactNode[] = [];
  // fresh regex per call: parseRichText recurses, a shared one would clobber lastIndex
  const regex = new RegExp(TOKEN.source, "g");
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = regex.exec(text))) {
    if (match.index > lastIndex) nodes.push(text.slice(lastIndex, match.index));
    const token = match[0];

    if (/^_{3,}$/.test(token)) {
      nodes.push(token); // a blank, not formatting
    } else if (token.startsWith("**")) {
      nodes.push(<strong key={key++}>{parseRichText(token.slice(2, -2))}</strong>);
    } else if (token.startsWith("++") || token.startsWith("__")) {
      nodes.push(<u key={key++}>{parseRichText(token.slice(2, -2))}</u>);
    } else {
      nodes.push(<em key={key++}>{parseRichText(token.slice(1, -1))}</em>);
    }
    lastIndex = match.index + token.length;
  }
  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
}

// ---------- toggle helpers for the toolbar ----------

const MARK = { bold: "**", italic: "*", underline: "++" } as const;
type Kind = keyof typeof MARK;

// Is the selection [start, end) already fully wrapped by `kind`'s marker —
// either because the selected text itself starts/ends with the marker, or
// because the marker sits immediately outside the selection?
export function isSelectionWrapped(text: string, start: number, end: number, kind: Kind): boolean {
  const m = MARK[kind];
  const selected = text.slice(start, end);
  if (selected.startsWith(m) && selected.endsWith(m) && selected.length >= m.length * 2) return true;
  const before = text.slice(Math.max(0, start - m.length), start);
  const after = text.slice(end, end + m.length);
  return before === m && after === m;
}

// Toggle `kind` on the selection [start, end). Returns the new full text
// plus the new selection range (so the caller can restore focus/selection).
export function toggleFormat(
  text: string,
  start: number,
  end: number,
  kind: Kind
): { text: string; start: number; end: number } {
  const m = MARK[kind];
  const selected = text.slice(start, end);

  // Case 1: selection itself is "**word**" -> strip the inner markers.
  if (selected.startsWith(m) && selected.endsWith(m) && selected.length >= m.length * 2) {
    const inner = selected.slice(m.length, selected.length - m.length);
    return {
      text: text.slice(0, start) + inner + text.slice(end),
      start,
      end: start + inner.length,
    };
  }

  // Case 2: markers sit just outside the selection -> remove them.
  const before = text.slice(Math.max(0, start - m.length), start);
  const after = text.slice(end, end + m.length);
  if (before === m && after === m) {
    return {
      text: text.slice(0, start - m.length) + selected + text.slice(end + m.length),
      start: start - m.length,
      end: end - m.length,
    };
  }

  // Case 3: not wrapped -> wrap it.
  return {
    text: text.slice(0, start) + m + selected + m + text.slice(end),
    start: start + m.length,
    end: end + m.length,
  };
}
import React from "react";

// Markdown subset: **bold**, *italic*, __underline__ — hỗ trợ lồng nhau.
export function parseRichText(text: string): React.ReactNode {
  if (!text) return text;
  const nodes: React.ReactNode[] = [];
  const regex = /(\*\*.+?\*\*|__.+?__|\*.+?\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = regex.exec(text))) {
    if (match.index > lastIndex) nodes.push(text.slice(lastIndex, match.index));
    const token = match[0];
    if (token.startsWith("**")) {
      nodes.push(<strong key={key++}>{parseRichText(token.slice(2, -2))}</strong>);
    } else if (token.startsWith("__")) {
      nodes.push(<u key={key++}>{parseRichText(token.slice(2, -2))}</u>);
    } else {
      nodes.push(<em key={key++}>{parseRichText(token.slice(1, -1))}</em>);
    }
    lastIndex = match.index + token.length;
  }
  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
}
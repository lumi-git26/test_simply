import { PublicQuestion } from "@/lib/types";

export type PassageLite = { id: string; title: string | null; body: string };

export type ExamPart =
  | { kind: "questions"; label: string; questions: PublicQuestion[] }
  | { kind: "passage"; label: string; passage: PassageLite; questions: PublicQuestion[] };

// Part 1 = every question without a (known) passage.
// Part 2.k = one passage + its questions, in order of the passage's first question.
// Passages with no questions are skipped (there is nothing for a student to answer).
export function buildParts(questions: PublicQuestion[], passages: PassageLite[]): ExamPart[] {
  const sorted = [...questions].sort((a, b) => a.order_index - b.order_index);
  const known = new Set(passages.map((p) => p.id));
  const part1 = sorted.filter((q) => !q.passage_id || !known.has(q.passage_id));

  const parts: ExamPart[] = [];
  if (part1.length) parts.push({ kind: "questions", label: "Part 1", questions: part1 });

  const passageOrder: string[] = [];
  for (const q of sorted) {
    if (q.passage_id && known.has(q.passage_id) && !passageOrder.includes(q.passage_id)) {
      passageOrder.push(q.passage_id);
    }
  }
  passageOrder.forEach((pid, i) => {
    const passage = passages.find((p) => p.id === pid)!;
    parts.push({
      kind: "passage",
      label: `Part 2.${i + 1}`,
      passage,
      questions: sorted.filter((q) => q.passage_id === pid),
    });
  });

  return parts;
}
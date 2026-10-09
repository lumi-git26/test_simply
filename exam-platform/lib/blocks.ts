import { QuestionType } from "@/lib/types";

export type QuestionBlockData = {
  question_type: QuestionType;
  question_text: string;
  context: string;
  options: { A: string; B: string; C: string; D: string };
  correct_letter: "A" | "B" | "C" | "D";
  fill_answer: string; // fill_blank correct answer(s), ; separated
  order_items: string[]; // order type: items in the CORRECT order as typed by the teacher
  writing_answers: string; // writing_rewrite/rearrange model answer(s), ; separated
  points: number;
  explanation: string;
};

export type ReadingBlockData = { title: string; body: string };
export type InstructionBlockData = { text: string };

// Something that lives inside a part: a question or an instruction line.
export type Item =
  | { id: string; type: "question"; dbId: string | null; data: QuestionBlockData }
  | { id: string; type: "instruction"; data: InstructionBlockData };

// One Part 2.x: a reading passage plus the questions about it.
export type PassagePart = {
  id: string;
  dbId: string | null;
  title: string;
  body: string;
  items: Item[];
};

export type ExamDraft = { part1: Item[]; passages: PassagePart[] };

export function newQuestionItem(id: string): Item {
  return {
    id,
    type: "question",
    dbId: null,
    data: {
      question_type: "multiple_choice",
      question_text: "",
      context: "",
      options: { A: "", B: "", C: "", D: "" },
      correct_letter: "A",
      fill_answer: "",
      order_items: ["", ""],
      writing_answers: "",
      points: 1,
      explanation: "",
    },
  };
}

export function newInstructionItem(id: string): Item {
  return { id, type: "instruction", data: { text: "" } };
}

export function newPassagePart(id: string): PassagePart {
  return { id, dbId: null, title: "", body: "", items: [] };
}

// Shuffle `items` (the teacher-entered CORRECT order) for student display,
// returning the shuffled list plus the correct_answer index sequence that
// the taking-page OrderQuestion component expects.
export function shuffleOrderItems(items: string[]): { options: string[]; correct_answer: string } {
  const idx = items.map((_, i) => i);
  for (let i = idx.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  const options = idx.map((i) => items[i]);
  const correct_answer = items.map((_, originalPos) => idx.indexOf(originalPos)).join(",");
  return { options, correct_answer };
}
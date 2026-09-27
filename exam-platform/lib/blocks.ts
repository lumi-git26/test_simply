import { QuestionType } from "@/lib/types";

export type QuestionBlockData = {
  question_type: QuestionType;
  question_text: string;
  context: string;
  options: { A: string; B: string; C: string; D: string };
  correct_letter: "A" | "B" | "C" | "D";
  fill_answer: string; // fill_blank correct answer(s), ; separated
  order_items: string[]; // order type — items in the CORRECT order as typed by teacher
  writing_answers: string; // writing_rewrite/rearrange model answer(s), ; separated
  points: number;
  explanation: string;
};

export type ReadingBlockData = { title: string; body: string };
export type InstructionBlockData = { text: string };

export type Block =
  | { id: string; type: "question"; dbId: string | null; passageBlockId: string | null; data: QuestionBlockData }
  | { id: string; type: "reading"; dbId: string | null; data: ReadingBlockData }
  | { id: string; type: "instruction"; data: InstructionBlockData };

export function newQuestionBlock(id: string): Block {
  return {
    id,
    type: "question",
    dbId: null,
    passageBlockId: null,
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

export function newReadingBlock(id: string): Block {
  return { id, type: "reading", dbId: null, data: { title: "", body: "" } };
}

export function newInstructionBlock(id: string): Block {
  return { id, type: "instruction", data: { text: "" } };
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
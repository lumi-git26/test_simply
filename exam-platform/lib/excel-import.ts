import * as XLSX from "xlsx";

export type ParsedPassage = { passage_id: string; title: string; body: string };
export type ParsedQuestion = {
  part: 1 | 2;
  passage_id: string | null;
  question_type: "multiple_choice" | "fill_blank" | "writing_rewrite" | "writing_rearrange";
  question_text: string;
  options: Record<"A" | "B" | "C" | "D", string> | null;
  correct_answer: string;
  points: number;
  explanation: string | null;
};

const VALID_TYPES = new Set([
  "multiple_choice",
  "fill_blank",
  "writing_rewrite",
  "writing_rearrange",
]);

// Parses a workbook that follows exam_import_template.xlsx (sheets:
// "Passages" and "Questions"). Skips the example rows (identified by a
// leading "P1"/"example" marker is NOT assumed — caller should have the
// teacher delete example rows; this just validates and reports problems).
export function parseExamWorkbook(buffer: ArrayBuffer): {
  passages: ParsedPassage[];
  questions: ParsedQuestion[];
  errors: string[];
} {
  const wb = XLSX.read(buffer, { type: "array" });
  const errors: string[] = [];

  const passagesSheet = wb.Sheets["Passages"];
  const questionsSheet = wb.Sheets["Questions"];
  if (!questionsSheet) {
    return { passages: [], questions: [], errors: ["Không tìm thấy sheet 'Questions'."] };
  }

  const passageRows: any[] = passagesSheet ? XLSX.utils.sheet_to_json(passagesSheet) : [];
  const passages: ParsedPassage[] = passageRows
    .filter((r) => r.passage_id)
    .map((r) => ({
      passage_id: String(r.passage_id).trim(),
      title: r.passage_title ? String(r.passage_title).trim() : "",
      body: String(r.passage_text ?? "").trim(),
    }));
  const passageIds = new Set(passages.map((p) => p.passage_id));

  const questionRows: any[] = XLSX.utils.sheet_to_json(questionsSheet);
  const questions: ParsedQuestion[] = [];

  questionRows.forEach((row, i) => {
    const rowNum = i + 2; // account for header row
    if (!row.question_text) return; // skip blank rows

    const type = String(row.question_type ?? "").trim();
    if (!VALID_TYPES.has(type)) {
      errors.push(`Dòng ${rowNum}: question_type '${type}' không hợp lệ.`);
      return;
    }

    const part = Number(row.part) === 2 ? 2 : 1;
    const passageId = row.passage_id ? String(row.passage_id).trim() : null;
    if (part === 2 && (!passageId || !passageIds.has(passageId))) {
      errors.push(`Dòng ${rowNum}: part = 2 nhưng passage_id '${passageId}' không tồn tại trong sheet Passages.`);
    }

    let options: Record<"A" | "B" | "C" | "D", string> | null = null;
    if (type === "multiple_choice") {
      options = {
        A: String(row.option_a ?? "").trim(),
        B: String(row.option_b ?? "").trim(),
        C: String(row.option_c ?? "").trim(),
        D: String(row.option_d ?? "").trim(),
      };
      if (!options.A || !options.B) {
        errors.push(`Dòng ${rowNum}: multiple_choice thiếu option_a/option_b.`);
      }
    }

    if (!row.correct_answer) {
      errors.push(`Dòng ${rowNum}: thiếu correct_answer.`);
    }

    questions.push({
      part: part as 1 | 2,
      passage_id: part === 2 ? passageId : null,
      question_type: type as ParsedQuestion["question_type"],
      question_text: String(row.question_text).trim(),
      options,
      correct_answer: String(row.correct_answer ?? "").trim(),
      points: row.points ? Number(row.points) : 1,
      explanation: row.explanation ? String(row.explanation).trim() : null,
    });
  });

  return { passages, questions, errors };
}

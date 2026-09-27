import * as XLSX from "xlsx";

export type ParsedPassage = { passage_id: string; title: string; body: string };
export type ParsedQuestion = {
  part: 1 | 2;
  passage_id: string | null;
  question_type: "multiple_choice" | "fill_blank" | "writing_rewrite" | "writing_rearrange" | "order";
  question_text: string;
  context: string | null;
  options: Record<"A" | "B" | "C" | "D", string> | string[] | null;
  correct_answer: string;
  points: number;
  explanation: string | null;
  instruction: string | null;
};

const VALID_TYPES = new Set([
  "multiple_choice",
  "fill_blank",
  "writing_rewrite",
  "writing_rearrange",
  "order",
]);

// Parses a workbook that follows exam_import_template.xlsx (sheets:
// "Passages" and "Questions").
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
    // A row counts as real data if it has a question_type — question_text
    // may legitimately be blank (e.g. stress/pronunciation questions where
    // the instruction row carries the actual prompt).
    if (!row.question_type) return;

    const type = String(row.question_type).trim();
    if (!VALID_TYPES.has(type)) {
      errors.push(`Dòng ${rowNum}: question_type '${type}' không hợp lệ.`);
      return;
    }

    const part = Number(row.part) === 2 ? 2 : 1;
    const passageId = row.passage_id ? String(row.passage_id).trim() : null;
    if (part === 2 && (!passageId || !passageIds.has(passageId))) {
      errors.push(`Dòng ${rowNum}: part = 2 nhưng passage_id '${passageId}' không tồn tại trong sheet Passages.`);
    }

    let options: Record<"A" | "B" | "C" | "D", string> | string[] | null = null;

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

    if (type === "order") {
      const raw = String(row.order_items ?? "").trim();
      if (!raw) {
        errors.push(`Dòng ${rowNum}: order cần điền cột order_items (các câu cách nhau bởi ;).`);
      } else {
        options = raw.split(";").map((s) => s.trim()).filter(Boolean);
        if (options.length < 2) {
          errors.push(`Dòng ${rowNum}: order_items cần ít nhất 2 phần tử.`);
        }
      }
      // correct_answer for "order" must be comma-separated indices into order_items
      if (row.correct_answer && !/^\d+(,\d+)*$/.test(String(row.correct_answer).trim())) {
        errors.push(`Dòng ${rowNum}: order cần correct_answer dạng chỉ số cách nhau dấu phẩy, ví dụ "1,2,0".`);
      }
    }

    if (!row.correct_answer) {
      errors.push(`Dòng ${rowNum}: thiếu correct_answer.`);
    }

    // question_text may be empty ONLY for multiple_choice (stress/pronunciation
    // style questions) — other types still require it.
    if (!row.question_text && type !== "multiple_choice") {
      errors.push(`Dòng ${rowNum}: question_text không được để trống với dạng '${type}'.`);
    }

    questions.push({
      part: part as 1 | 2,
      passage_id: part === 2 ? passageId : null,
      question_type: type as ParsedQuestion["question_type"],
      question_text: row.question_text ? String(row.question_text).trim() : "",
      context: row.context ? String(row.context).trim() : null,
      options,
      correct_answer: String(row.correct_answer ?? "").trim(),
      points: row.points ? Number(row.points) : 1,
      explanation: row.explanation ? String(row.explanation).trim() : null,
      instruction: row.instruction ? String(row.instruction).trim() : null,
    });
  });

  return { passages, questions, errors };
}
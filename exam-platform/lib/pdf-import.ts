const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.1-flash-lite";
const API_KEY = process.env.GEMINI_API_KEY;

export type ExtractedPassage = { passage_id: string; title: string; body: string };
export type ExtractedQuestion = {
  part: 1 | 2;
  passage_id: string | null;
  question_type: "multiple_choice" | "fill_blank" | "writing_rewrite" | "writing_rearrange";
  question_text: string;
  options: Record<"A" | "B" | "C" | "D", string> | null;
  correct_answer: string;
  points: number;
  explanation: string | null;
};

const EXTRACTION_PROMPT = `You are extracting exam questions from a PDF into structured JSON.

Return ONLY valid JSON (no markdown, no commentary), matching exactly this shape:
{
  "passages": [ { "passage_id": "P1", "title": "string", "body": "string" } ],
  "questions": [
    {
      "part": 1 or 2,
      "passage_id": null or "P1" (must reference a passage_id from "passages", only for reading questions),
      "question_type": "multiple_choice" | "fill_blank" | "writing_rewrite" | "writing_rearrange",
      "question_text": "string (use ___ for the blank in fill_blank questions)",
      "options": null or {"A": "string", "B": "string", "C": "string", "D": "string"} (only for multiple_choice),
      "correct_answer": "string (letter A/B/C/D for multiple_choice; the accepted answer(s) separated by ; for other types)",
      "points": number (default 1),
      "explanation": null or "short explanation of the answer if present in the PDF"
    }
  ]
}

Rules:
- If the PDF has no reading passages, "passages" should be an empty array and every question has part=1, passage_id=null.
- If the PDF contains a reading passage with questions about it, put that passage in "passages" and set part=2 + the matching passage_id on its questions.
- Only extract question types that fit multiple_choice, fill_blank, writing_rewrite, or writing_rearrange. Skip question types that don't fit (e.g. pure listening, essay writing) and do not invent answers you cannot determine from the PDF — if the correct answer is not shown in the PDF, put your best-guess answer and set explanation to "AI-inferred answer, please verify".
- Keep question_text and options exactly as written in the PDF (translate nothing).`;

export async function extractQuestionsFromPdf(
  base64Pdf: string
): Promise<{ passages: ExtractedPassage[]; questions: ExtractedQuestion[]; error?: string }> {
  if (!API_KEY) {
    return { passages: [], questions: [], error: "GEMINI_API_KEY chưa được cấu hình." };
  }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: EXTRACTION_PROMPT },
              { inline_data: { mime_type: "application/pdf", data: base64Pdf } },
            ],
          },
        ],
        generationConfig: { responseMimeType: "application/json", maxOutputTokens: 32768 },
      }),
    }
  );

  if (!res.ok) {
    const body = await res.text();
    return { passages: [], questions: [], error: `Gemini error ${res.status}: ${body.slice(0, 500)}` };
  }

  const data = await res.json();
  const candidate = data?.candidates?.[0];
  const text = candidate?.content?.parts?.[0]?.text;

  if (!text) {
    // Surface the REAL reason instead of a generic message — common causes:
    // "MAX_TOKENS" (response got cut off), "SAFETY" (content blocked),
    // or promptFeedback.blockReason (the PDF itself got blocked).
    const finishReason = candidate?.finishReason;
    const blockReason = data?.promptFeedback?.blockReason;
    return {
      passages: [],
      questions: [],
      error: `Gemini không trả về nội dung. finishReason=${finishReason ?? "?"} blockReason=${blockReason ?? "?"}. Thử PDF ngắn hơn hoặc chia nhỏ đề thi.`,
    };
  }

  try {
    const parsed = JSON.parse(text);
    return { passages: parsed.passages ?? [], questions: parsed.questions ?? [] };
  } catch {
    return { passages: [], questions: [], error: `Không parse được JSON từ Gemini. Raw (500 ký tự đầu): ${text.slice(0, 500)}` };
  }
}
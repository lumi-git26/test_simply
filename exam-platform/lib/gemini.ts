const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.1-flash-lite";
const API_KEY = process.env.GEMINI_API_KEY;

// Pass/fail grading only (per product decision) — Gemini compares the
// student's answer against the teacher-provided model answer(s) and returns
// a short reason, which we keep as ai_feedback for debugging/teacher review.
export async function gradeWritingAnswer({
  questionText,
  modelAnswers,
  studentAnswer,
}: {
  questionText: string;
  modelAnswers: string[];
  studentAnswer: string;
}): Promise<{ pass: boolean; feedback: string }> {
  if (!studentAnswer.trim()) {
    return { pass: false, feedback: "No answer submitted." };
  }
  if (!API_KEY) {
    // Fail safe in dev without a key: exact/loose match fallback.
    const normalized = studentAnswer.trim().toLowerCase();
    const pass = modelAnswers.some((m) => m.trim().toLowerCase() === normalized);
    return { pass, feedback: "GEMINI_API_KEY not set — used exact-match fallback." };
  }

  const prompt = `You are grading an English exercise. Respond ONLY with JSON: {"pass": boolean, "reason": string}.
Task: "${questionText}"
Acceptable model answer(s): ${modelAnswers.map((m) => `"${m}"`).join(", ")}
Student answer: "${studentAnswer}"
Mark pass=true if the student's answer is grammatically correct and conveys the same meaning as a model answer, allowing for minor wording differences. Otherwise pass=false. Keep "reason" under 20 words.`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" },
      }),
    }
  );

  if (!res.ok) {
    return { pass: false, feedback: `Gemini error: ${res.status}` };
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
  try {
    const parsed = JSON.parse(text);
    return { pass: !!parsed.pass, feedback: parsed.reason ?? "" };
  } catch {
    return { pass: false, feedback: "Could not parse Gemini response." };
  }
}

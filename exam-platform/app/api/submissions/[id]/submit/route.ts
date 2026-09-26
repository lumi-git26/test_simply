import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { gradeWritingAnswer } from "@/lib/gemini";

// POST /api/submissions/[id]/submit
// body: { answers: { question_id: string; value: string }[]; autoSubmitted?: boolean }
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createAdminClient();
  const { answers, autoSubmitted } = await req.json();

  const { data: submission, error: subErr } = await supabase
    .from("submissions")
    .select("*, exams(*)")
    .eq("id", params.id)
    .single();

  if (subErr || !submission) {
    return NextResponse.json({ error: "Submission not found" }, { status: 404 });
  }
  if (submission.status !== "in_progress") {
    return NextResponse.json({ error: "Already submitted" }, { status: 409 });
  }

  const { data: questions } = await supabase
    .from("questions")
    .select("*")
    .eq("exam_id", submission.exam_id);

  const byId = new Map((questions ?? []).map((q) => [q.id, q]));
  let totalScore = 0;
  let maxScore = 0;

  const rows = [];
  for (const q of questions ?? []) {
    maxScore += Number(q.points);
    const answer = (answers as { question_id: string; value: string }[]).find(
      (a) => a.question_id === q.id
    );
    const studentAnswer = answer?.value ?? "";

    let isCorrect: boolean | null = null;
    let aiFeedback: string | null = null;
    let pointsAwarded = 0;

    if (q.question_type === "multiple_choice" || q.question_type === "fill_blank") {
      const acceptable = q.correct_answer.split(";").map((s: string) => s.trim().toLowerCase());
      isCorrect = acceptable.includes(studentAnswer.trim().toLowerCase());
      pointsAwarded = isCorrect ? Number(q.points) : 0;
    } else {
      // writing_rewrite / writing_rearrange -> ask Gemini for a pass/fail verdict
      const result = await gradeWritingAnswer({
        questionText: q.question_text,
        modelAnswers: q.correct_answer.split(";").map((s: string) => s.trim()),
        studentAnswer,
      });
      isCorrect = result.pass;
      aiFeedback = result.feedback;
      pointsAwarded = result.pass ? Number(q.points) : 0;
    }

    totalScore += pointsAwarded;
    rows.push({
      submission_id: submission.id,
      question_id: q.id,
      student_answer: studentAnswer,
      is_correct: isCorrect,
      ai_feedback: aiFeedback,
      points_awarded: pointsAwarded,
    });
  }

  await supabase.from("answers").insert(rows);

  const settings = (
    await supabase.from("exam_settings").select("*").eq("exam_id", submission.exam_id).single()
  ).data;

  await supabase
    .from("submissions")
    .update({
      submitted_at: new Date().toISOString(),
      auto_submitted: !!autoSubmitted,
      status: "graded",
      total_score: totalScore,
      max_score: maxScore,
      reviewed_by_teacher: settings?.show_result_instantly ? true : false,
    })
    .eq("id", submission.id);

  return NextResponse.json({
    totalScore,
    maxScore,
    showResultInstantly: !!settings?.show_result_instantly,
  });
}

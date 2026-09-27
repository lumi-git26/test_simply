import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createAdminClient();

  const { data: submission, error } = await supabase
    .from("submissions")
    .select("*, exams(title)")
    .eq("id", params.id)
    .single();

  if (error || !submission) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (submission.status !== "graded") {
    return NextResponse.json({ error: "Not graded yet" }, { status: 409 });
  }

  const [{ data: questions }, { data: answers }, { data: passages }] = await Promise.all([
    supabase.from("questions").select("*").eq("exam_id", submission.exam_id).order("order_index"),
    supabase.from("answers").select("*").eq("submission_id", submission.id),
    supabase.from("passages").select("*").eq("exam_id", submission.exam_id).order("order_index"),
  ]);

  const answerByQuestion = new Map((answers ?? []).map((a) => [a.question_id, a]));

  const review = (questions ?? []).map((q) => {
    const a = answerByQuestion.get(q.id);
    return {
      id: q.id,
      passage_id: q.passage_id,
      question_type: q.question_type,
      question_text: q.question_text,
      options: q.options,
      correct_answer: q.correct_answer,
      explanation: q.explanation,
      student_answer: a?.student_answer ?? "",
      is_correct: a?.is_correct ?? null,
      ai_feedback: a?.ai_feedback ?? null,
    };
  });

  return NextResponse.json({
    examTitle: (submission as any).exams?.title,
    totalScore: submission.total_score,
    maxScore: submission.max_score,
    passages: passages ?? [],
    questions: review,
  });
}
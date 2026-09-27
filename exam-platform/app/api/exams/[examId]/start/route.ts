import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// POST /api/exams/[slug]/start
// body: { name?: string; email?: string }
// Creates a submission row and returns the exam payload WITHOUT correct
// answers, plus the submission id and a computed deadline timestamp.
export async function POST(req: NextRequest, { params }: { params: { examId: string } }) {
  const supabase = createAdminClient();
  const body = await req.json().catch(() => ({}));

  const { data: exam, error: examErr } = await supabase
    .from("exams")
    .select("*, exam_settings(*)")
    .eq("share_slug", params.examId)
    .eq("status", "published")
    .single();

  if (examErr || !exam) {
    return NextResponse.json({ error: "Exam not found" }, { status: 404 });
  }

  const settings = exam.exam_settings;

  // enforce max_attempts if the student identified themselves
  if (settings?.max_attempts && body.email) {
    const { count } = await supabase
      .from("submissions")
      .select("id", { count: "exact", head: true })
      .eq("exam_id", exam.id)
      .eq("student_email", body.email);
    if ((count ?? 0) >= settings.max_attempts) {
      return NextResponse.json({ error: "Max attempts reached" }, { status: 403 });
    }
  }

  const { data: submission, error: subErr } = await supabase
    .from("submissions")
    .insert({
      exam_id: exam.id,
      student_name: body.name ?? null,
      student_email: body.email ?? null,
    })
    .select()
    .single();

  if (subErr) {
    return NextResponse.json({ error: subErr.message }, { status: 500 });
  }

  const [{ data: passages }, { data: questions }] = await Promise.all([
    supabase.from("passages").select("*").eq("exam_id", exam.id).order("order_index"),
    supabase
      .from("questions")
      .select("id, exam_id, passage_id, part, order_index, question_type, question_text, options, points, instruction")
      .eq("exam_id", exam.id)
      .order("order_index"),
  ]);

  const deadline = exam.time_limit_minutes
    ? Date.now() + exam.time_limit_minutes * 60 * 1000
    : null;

  return NextResponse.json({
    submissionId: submission.id,
    exam: { id: exam.id, title: exam.title, time_limit_minutes: exam.time_limit_minutes },
    settings,
    passages: passages ?? [],
    questions: questions ?? [],
    deadline,
  });
}

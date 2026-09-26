import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest, { params }: { params: { examId: string } }) {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: exam } = await supabase
    .from("exams")
    .select("id, teacher_id")
    .eq("id", params.examId)
    .single();
  if (!exam || exam.teacher_id !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { passages, questions } = await req.json();

  const idMap = new Map<string, string>();
  if (passages?.length) {
    const { data: inserted, error } = await supabase
      .from("passages")
      .insert(
        passages.map((p: any, i: number) => ({
          exam_id: exam.id,
          title: p.title || null,
          body: p.body,
          order_index: i,
        }))
      )
      .select();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    inserted!.forEach((row, i) => idMap.set(passages[i].passage_id, row.id));
  }

  const { error: qErr, count } = await supabase
    .from("questions")
    .insert(
      questions.map((q: any, i: number) => ({
        exam_id: exam.id,
        passage_id: q.passage_id ? idMap.get(q.passage_id) ?? null : null,
        part: q.part ?? 1,
        order_index: i,
        question_type: q.question_type,
        question_text: q.question_text,
        options: q.options ?? null,
        correct_answer: q.correct_answer,
        points: q.points ?? 1,
        explanation: q.explanation ?? null,
      })),
      { count: "exact" }
    );

  if (qErr) return NextResponse.json({ error: qErr.message }, { status: 500 });

  return NextResponse.json({ imported: count ?? questions.length });
}
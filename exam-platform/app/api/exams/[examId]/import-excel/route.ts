import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { parseExamWorkbook } from "@/lib/excel-import";

export async function POST(req: NextRequest, { params }: { params: { examId: string } }) {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // ownership check
  const { data: exam } = await supabase
    .from("exams")
    .select("id, teacher_id")
    .eq("id", params.examId)
    .single();
  if (!exam || exam.teacher_id !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });

  const buffer = await file.arrayBuffer();
  const { passages, questions, errors } = parseExamWorkbook(buffer);

  if (errors.length) {
    return NextResponse.json({ error: "Validation failed", details: errors }, { status: 422 });
  }

  // insert passages first, build id map from template's passage_id -> real uuid
  const idMap = new Map<string, string>();
  if (passages.length) {
    const { data: inserted, error } = await supabase
      .from("passages")
      .insert(
        passages.map((p, i) => ({
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
      questions.map((q, i) => ({
        exam_id: exam.id,
        passage_id: q.passage_id ? idMap.get(q.passage_id) ?? null : null,
        part: q.part,
        order_index: i,
        question_type: q.question_type,
        question_text: q.question_text,
        options: q.options,
        correct_answer: q.correct_answer,
        points: q.points,
        explanation: q.explanation,
      })),
      { count: "exact" }
    );

  if (qErr) return NextResponse.json({ error: qErr.message }, { status: 500 });

  return NextResponse.json({ imported: count ?? questions.length, passages: passages.length });
}

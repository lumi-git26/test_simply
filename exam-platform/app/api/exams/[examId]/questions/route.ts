import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest, { params }: { params: { examId: string } }) {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  const { count } = await supabase
    .from("questions")
    .select("id", { count: "exact", head: true })
    .eq("exam_id", params.examId);

  const { data, error } = await supabase
    .from("questions")
    .insert({
      exam_id: params.examId,
      passage_id: body.passage_id ?? null,
      part: body.part ?? 1,
      order_index: count ?? 0,
      question_type: body.question_type,
      question_text: body.question_text,
      options: body.options ?? null,
      correct_answer: body.correct_answer,
      points: body.points ?? 1,
      explanation: body.explanation ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest, { params }: { params: { examId: string } }) {
  const supabase = createAdminClient();
  const { email } = await req.json();

  if (!email || !/.+@.+\..+/.test(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const { data: exam } = await supabase
    .from("exams")
    .select("teacher_id")
    .eq("share_slug", params.examId)
    .single();

  if (!exam) {
    return NextResponse.json({ error: "Exam not found" }, { status: 404 });
  }

  // upsert so re-subscribing (unique teacher_id+email) doesn't error
  const { error } = await supabase
    .from("subscribers")
    .upsert({ teacher_id: exam.teacher_id, email }, { onConflict: "teacher_id,email" });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

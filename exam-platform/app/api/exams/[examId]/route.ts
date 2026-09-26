import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function PATCH(req: NextRequest, { params }: { params: { examId: string } }) {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const allowed = ["title", "description", "time_limit_minutes", "status"];
  const update: Record<string, unknown> = {};
  for (const key of allowed) if (key in body) update[key] = body[key];
  update.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("exams")
    .update(update)
    .eq("id", params.examId)
    .eq("teacher_id", user.id) // RLS already enforces this, kept explicit for clarity
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

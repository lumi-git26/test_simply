import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function PATCH(req: NextRequest, { params }: { params: { examId: string } }) {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const allowed = ["title", "description", "time_limit_minutes", "status", "tags"];
  const update: Record<string, unknown> = {};
  for (const key of allowed) if (key in body) update[key] = body[key];

  if ("tags" in update) {
    const raw = update.tags;
    if (!Array.isArray(raw) || raw.some((t) => typeof t !== "string")) {
      return NextResponse.json({ error: "tags must be an array of strings" }, { status: 400 });
    }
    // trim, drop empties, dedupe case-insensitively
    const seen = new Set<string>();
    update.tags = (raw as string[])
      .map((t) => t.trim())
      .filter((t) => {
        const k = t.toLowerCase();
        if (!t || seen.has(k)) return false;
        seen.add(k);
        return true;
      });
  }

  update.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("exams")
    .update(update)
    .eq("id", params.examId)
    .eq("teacher_id", user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
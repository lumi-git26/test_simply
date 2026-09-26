import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { extractQuestionsFromPdf } from "@/lib/pdf-import";

const VALID_TYPES = new Set([
  "multiple_choice",
  "fill_blank",
  "writing_rewrite",
  "writing_rearrange",
]);

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

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  if (file.type !== "application/pdf") {
    return NextResponse.json({ error: "File phải là PDF" }, { status: 400 });
  }
  if (file.size > 15 * 1024 * 1024) {
    return NextResponse.json({ error: "PDF quá lớn (tối đa 15MB)" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const base64 = buffer.toString("base64");

  const { passages, questions, error } = await extractQuestionsFromPdf(base64);
  if (error) return NextResponse.json({ error }, { status: 502 });

  const badRows = questions.filter((q) => !VALID_TYPES.has(q.question_type) || !q.question_text || !q.correct_answer);
  if (badRows.length) {
    return NextResponse.json(
      {
        error: "AI trích xuất được một số câu không hợp lệ, vui lòng thử lại hoặc kiểm tra PDF.",
        preview: { passages, questions },
      },
      { status: 422 }
    );
  }

  if (!questions.length) {
    return NextResponse.json({ error: "Không tìm thấy câu hỏi nào trong PDF." }, { status: 422 });
  }

  return NextResponse.json({ passages, questions });
}
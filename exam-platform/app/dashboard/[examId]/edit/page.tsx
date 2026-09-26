import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { ExamEditor } from "@/components/exam-builder/ExamEditor";

export default async function EditExamPage({ params }: { params: { examId: string } }) {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: exam } = await supabase
    .from("exams")
    .select("*")
    .eq("id", params.examId)
    .eq("teacher_id", user.id)
    .single();

  if (!exam) notFound();

  const { data: settings } = await supabase
    .from("exam_settings")
    .select("*")
    .eq("exam_id", exam.id)
    .single();

  const { data: questions } = await supabase
    .from("questions")
    .select("*")
    .eq("exam_id", exam.id)
    .order("order_index");

  return (
    <ExamEditor exam={exam} settings={settings!} initialQuestions={questions ?? []} />
  );
}

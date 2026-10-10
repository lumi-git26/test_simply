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

  let { data: settings } = await supabase
    .from("exam_settings")
    .select("*")
    .eq("exam_id", exam.id)
    .maybeSingle();

  // an exam must always have a settings row; create the default one if it is missing
  if (!settings) {
    const { data: created } = await supabase
      .from("exam_settings")
      .insert({ exam_id: exam.id })
      .select()
      .single();
    settings = created;
  }

  const { data: questions } = await supabase
    .from("questions")
    .select("*")
    .eq("exam_id", exam.id)
    .order("order_index");

  const { data: passages } = await supabase
    .from("passages")
    .select("*")
    .eq("exam_id", exam.id)
    .order("order_index");

  return (
    <ExamEditor
      exam={exam}
      settings={settings!}
      initialQuestions={questions ?? []}
      initialPassages={passages ?? []}
    />
  );
}
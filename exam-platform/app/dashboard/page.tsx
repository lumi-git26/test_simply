import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ExamCard } from "@/components/exam-builder/ExamCard";

export default async function DashboardPage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: exams } = await supabase
    .from("exams")
    .select("id, title, status, share_slug, created_at, exam_settings(*)")
    .eq("teacher_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <main className="min-h-screen px-6 py-10 md:px-16">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold">My exams</h1>
        <Link href="/dashboard/new">
          <Button>+ New exam</Button>
        </Link>
      </div>

      {!exams?.length && (
        <p className="text-ink-soft">No exams yet — click "New exam" to get started.</p>
      )}

      <div className="grid gap-4">
        {exams?.map((exam) => (
          <ExamCard
            key={exam.id}
            exam={exam}
            settings={(exam as any).exam_settings}
          />
        ))}
      </div>
    </main>
  );
}
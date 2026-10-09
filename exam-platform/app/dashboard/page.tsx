import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { DashboardList, ExamRow } from "@/components/exam-builder/DashboardList";

export default async function DashboardPage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: exams } = await supabase
    .from("exams")
    .select("id, title, status, share_slug, created_at, tags, exam_settings(*)")
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

      <DashboardList initialExams={(exams ?? []) as unknown as ExamRow[]} />
    </main>
  );
}
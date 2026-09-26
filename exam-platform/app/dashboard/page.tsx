import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default async function DashboardPage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: exams } = await supabase
    .from("exams")
    .select("id, title, status, share_slug, created_at")
    .eq("teacher_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <main className="min-h-screen px-6 py-10 md:px-16">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Bài kiểm tra của tôi</h1>
        <Link href="/dashboard/new">
          <Button>+ Tạo bài mới</Button>
        </Link>
      </div>

      {!exams?.length && (
        <p className="text-ink-soft">Chưa có bài kiểm tra nào. Bấm "Tạo bài mới" để bắt đầu.</p>
      )}

      <div className="grid gap-4">
        {exams?.map((exam) => (
          <Link
            key={exam.id}
            href={`/dashboard/${exam.id}/edit`}
            className="flex items-center justify-between rounded-card border border-border
                       bg-paper-dark px-6 py-5 hover:border-ink transition"
          >
            <div>
              <p className="font-semibold">{exam.title}</p>
              <p className="text-sm text-ink-soft">
                /{exam.share_slug} —{" "}
                {exam.status === "published" ? "Đã publish" : "Bản nháp"}
              </p>
            </div>
            <span className="text-ink-soft">→</span>
          </Link>
        ))}
      </div>
    </main>
  );
}

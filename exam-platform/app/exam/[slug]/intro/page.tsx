import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/Button";
import { notFound } from "next/navigation";

// Matches screenshot 2: "Welcome, {name}" + exam title card + START.
export default async function ExamIntroPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { name?: string };
}) {
  const supabase = createServerSupabaseClient();
  const { data: exam } = await supabase
    .from("exams")
    .select("id, title, time_limit_minutes, teacher_id, teachers(display_name)")
    .eq("share_slug", params.slug)
    .eq("status", "published")
    .single();

  if (!exam) notFound();

  const authorName = (exam as any).teachers?.display_name ?? "Teacher";
  const displayName = searchParams.name || "Guest";

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="w-full max-w-lg">
        <p className="text-xl">
          Welcome, <span className="font-semibold">{displayName}</span>
        </p>
        <p className="mt-6 text-lg text-ink-soft">This is:</p>

        <div className="mt-4 rounded-card bg-ink px-8 py-10 text-paper">
          <h1 className="text-3xl font-bold">{exam.title}</h1>
          <p className="mt-4 text-paper/80">
            Time: {exam.time_limit_minutes ? `${exam.time_limit_minutes} minute` : "No limit"} — Author:{" "}
            {authorName}
          </p>
        </div>

        <a href={`/exam/${params.slug}/take?name=${encodeURIComponent(displayName)}`}>
          <Button variant="outline" className="mt-8 w-full">
            START
          </Button>
        </a>
      </div>
    </main>
  );
}

"use client";

import { useMemo, useState } from "react";
import { ExamSettings } from "@/lib/types";
import { ExamCard } from "@/components/exam-builder/ExamCard";

export type ExamRow = {
  id: string;
  title: string;
  status: string;
  share_slug: string;
  created_at: string;
  tags: string[];
  exam_settings: ExamSettings;
};

export function DashboardList({ initialExams }: { initialExams: ExamRow[] }) {
  const [exams, setExams] = useState(initialExams);
  const [query, setQuery] = useState("");
  const [activeTags, setActiveTags] = useState<string[]>([]);

  // every distinct tag (case-insensitive) with how many exams use it
  const allTags = useMemo(() => {
    const counts = new Map<string, { label: string; count: number }>();
    for (const e of exams) {
      for (const t of e.tags ?? []) {
        const k = t.toLowerCase();
        const cur = counts.get(k);
        counts.set(k, { label: cur?.label ?? t, count: (cur?.count ?? 0) + 1 });
      }
    }
    return [...counts.entries()]
      .map(([key, v]) => ({ key, ...v }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [exams]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return exams.filter((e) => {
      const matchesQuery =
        !q || e.title.toLowerCase().includes(q) || e.share_slug.toLowerCase().includes(q);
      const examTags = (e.tags ?? []).map((t) => t.toLowerCase());
      // selected tags combine with AND: the exam must have all of them
      const matchesTags = activeTags.every((t) => examTags.includes(t));
      return matchesQuery && matchesTags;
    });
  }, [exams, query, activeTags]);

  function toggleTag(key: string) {
    setActiveTags((prev) => (prev.includes(key) ? prev.filter((t) => t !== key) : [...prev, key]));
  }

  function handleTagsChange(id: string, tags: string[]) {
    setExams((prev) => prev.map((e) => (e.id === id ? { ...e, tags } : e)));
    // drop any active filter whose tag no longer exists anywhere
    setActiveTags((prev) =>
      prev.filter((k) =>
        exams.some((e) =>
          (e.id === id ? tags : e.tags ?? []).some((t) => t.toLowerCase() === k)
        )
      )
    );
  }

  return (
    <div>
      <input
        className="input-field mb-3"
        placeholder="Search exams by title or slug"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {allTags.length > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          {allTags.map((t) => {
            const on = activeTags.includes(t.key);
            return (
              <button
                key={t.key}
                onClick={() => toggleTag(t.key)}
                className={`rounded-md border px-2.5 py-1 text-xs transition ${
                  on
                    ? "border-ink bg-ink text-paper"
                    : "border-border text-ink-soft hover:border-ink hover:text-ink"
                }`}
              >
                {t.label} <span className="opacity-60">{t.count}</span>
              </button>
            );
          })}
          {activeTags.length > 0 && (
            <button onClick={() => setActiveTags([])} className="text-xs text-ink-soft underline">
              Clear
            </button>
          )}
        </div>
      )}

      {!exams.length && (
        <p className="text-ink-soft">No exams yet. Click "New exam" to get started.</p>
      )}
      {exams.length > 0 && !filtered.length && (
        <p className="text-ink-soft">No exams match your search.</p>
      )}

      <div className="grid gap-4">
        {filtered.map((exam) => (
          <ExamCard
            key={exam.id}
            exam={exam}
            settings={exam.exam_settings}
            onTagsChange={handleTagsChange}
          />
        ))}
      </div>
    </div>
  );
}
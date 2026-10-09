"use client";

import { useMemo, useState } from "react";
import { ExamDraft, Item, shuffleOrderItems } from "@/lib/blocks";
import { PublicQuestion } from "@/lib/types";
import { buildParts, PassageLite } from "@/lib/parts";
import { ExamPlayer } from "@/components/exam-taking/ExamPlayer";

export function PreviewModal({
  draft,
  examTitle,
  timeLimitMinutes,
  onClose,
}: {
  draft: ExamDraft;
  examTitle: string;
  timeLimitMinutes: number | null;
  onClose: () => void;
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({});

  // Turn the editor draft into exactly the data shape students receive.
  const parts = useMemo(() => {
    const questions: PublicQuestion[] = [];
    const passages: PassageLite[] = [];
    let order = 0;

    function addItems(items: Item[], passageId: string | null) {
      let instruction = "";
      for (const it of items) {
        if (it.type === "instruction") { instruction = it.data.text; continue; }
        const d = it.data;
        const options =
          d.question_type === "multiple_choice"
            ? d.options
            : d.question_type === "order"
            ? shuffleOrderItems(d.order_items.filter((s: string) => s.trim())).options
            : null;
        questions.push({
          id: it.id,
          exam_id: "preview",
          passage_id: passageId,
          part: passageId ? 2 : 1,
          order_index: order++,
          question_type: d.question_type,
          question_text: d.question_text,
          context: d.context || null,
          options: options as unknown as PublicQuestion["options"],
          points: d.points,
          instruction: instruction || null,
        });
      }
    }

    addItems(draft.part1, null);
    for (const p of draft.passages) {
      passages.push({ id: p.id, title: p.title || null, body: p.body });
      addItems(p.items, p.id);
    }
    return buildParts(questions, passages);
  }, [draft]);

  const timeText = timeLimitMinutes ? `${String(timeLimitMinutes).padStart(2, "0")}:00` : null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-paper">
      <ExamPlayer
        preview
        title={examTitle}
        timeText={timeText}
        parts={parts}
        answers={answers}
        onAnswer={(id, v) => setAnswers((a) => ({ ...a, [id]: v }))}
        onSubmit={() => {}}
      />
      <button
        onClick={onClose}
        className="fixed bottom-6 right-6 z-[60] rounded-md bg-ink px-4 py-2 text-sm text-paper shadow-lg"
      >
        Close preview
      </button>
    </div>
  );
}
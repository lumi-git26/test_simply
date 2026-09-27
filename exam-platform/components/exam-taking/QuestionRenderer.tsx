"use client";

import { PublicQuestion } from "@/lib/types";

export function QuestionRenderer({
  index,
  question,
  value,
  onChange,
}: {
  index: number;
  question: PublicQuestion;
  value: string;
  onChange: (val: string) => void;
}) {
  return (
    <div>
      <p className="text-lg">
        Question {index + 1}.{" "}
        {question.question_type === "fill_blank" ? (
          <InlineBlank question={question} value={value} onChange={onChange} />
        ) : (
          question.question_text
        )}
      </p>

      {question.question_type === "multiple_choice" && question.options && (
        <div className="mt-4 flex flex-wrap gap-3">
          {(["A", "B", "C", "D"] as const).map((key) => {
            const selected = value === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => onChange(key)}
                className={`rounded-lg border px-4 py-2 text-left transition
                  ${selected
                    ? "border-ink bg-ink text-paper"
                    : "border-transparent hover:border-ink"}
                `}
              >
                {key}. {question.options![key]}
              </button>
            );
          })}
        </div>
      )}

      {(question.question_type === "writing_rewrite" ||
        question.question_type === "writing_rearrange") && (
        <textarea
          className="input-field mt-4 min-h-[100px]"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Type your answer"
        />
      )}
    </div>
  );
}

function InlineBlank({
  question,
  value,
  onChange,
}: {
  question: PublicQuestion;
  value: string;
  onChange: (val: string) => void;
}) {
  if (!question.question_text.includes("___")) {
    return (
      <>
        {question.question_text}
        <input
          className="ml-2 inline-block w-32 rounded border border-ink px-2 py-1"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </>
    );
  }
  const [before, after] = question.question_text.split("___");
  return (
    <>
      {before}
      <input
        className="mx-1 inline-block w-28 rounded border border-ink px-2 py-1 text-center"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {after}
    </>
  );
}
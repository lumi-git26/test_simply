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
        <div className="mt-4 flex flex-wrap gap-x-10 gap-y-3">
          {(["A", "B", "C", "D"] as const).map((key) => (
            <label key={key} className="flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name={`q-${question.id}`}
                checked={value === key}
                onChange={() => onChange(key)}
              />
              <span>
                {key}. {question.options![key]}
              </span>
            </label>
          ))}
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

// fill_blank questions store the blank as "___" inside question_text; render
// it as an inline text input, matching screenshot 3's boxed blank.
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

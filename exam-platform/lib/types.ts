export type QuestionType =
  | "multiple_choice"
  | "fill_blank"
  | "writing_rewrite"
  | "writing_rearrange";

export type Exam = {
  id: string;
  teacher_id: string;
  title: string;
  description: string | null;
  time_limit_minutes: number | null;
  share_slug: string;
  status: "draft" | "published" | "archived";
  created_at: string;
  updated_at: string;
};

export type ExamSettings = {
  exam_id: string;
  show_result_instantly: boolean;
  due_at: string | null;
  max_attempts: number | null;
  allow_anonymous: boolean;
};

export type Passage = {
  id: string;
  exam_id: string;
  title: string | null;
  body: string;
  order_index: number;
};

export type Question = {
  id: string;
  exam_id: string;
  passage_id: string | null;
  part: 1 | 2;
  order_index: number;
  question_type: QuestionType;
  question_text: string;
  options: Record<"A" | "B" | "C" | "D", string> | null;
  correct_answer: string;
  points: number;
  explanation: string | null;
  instruction: string | null;
};

export type Submission = {
  id: string;
  exam_id: string;
  student_email: string | null;
  student_name: string | null;
  attempt_number: number;
  started_at: string;
  submitted_at: string | null;
  auto_submitted: boolean;
  status: "in_progress" | "submitted" | "graded";
  total_score: number | null;
  max_score: number | null;
  reviewed_by_teacher: boolean;
};

// Full exam payload sent to the student "take exam" screen.
// correct_answer / explanation are stripped server-side before this is sent.
export type PublicQuestion = Omit<Question, "correct_answer" | "explanation">;

export type ExamForTaking = {
  exam: Exam;
  settings: ExamSettings;
  passages: Passage[];
  questions: PublicQuestion[];
};
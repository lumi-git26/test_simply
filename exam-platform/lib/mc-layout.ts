// Quy tắc chọn bố cục cho multiple_choice, dựa trên độ dài đáp án dài nhất.
// - Bố cục 1 (4 cột, 1 hàng): đáp án ngắn, ví dụ "do" / "are" / "is" / "does".
// - Bố cục 2 (2 cột, 2 hàng): đáp án trung bình, không đủ chỗ xếp 4 cột đều nhau.
// - Bố cục 3 (1 cột, xếp dọc): đáp án dài, câu văn đầy đủ — bắt buộc xếp dọc để dễ đọc.
export function mcLayout(options: Record<"A" | "B" | "C" | "D", string>): "grid-4" | "grid-2" | "stack" {
  const lengths = Object.values(options).map((o) => o.length);
  const maxLen = Math.max(...lengths);

  if (maxLen <= 15) return "grid-4";
  if (maxLen <= 45) return "grid-2";
  return "stack";
}
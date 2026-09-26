# Exam Platform

## Đã có trong bản scaffold này
### Học sinh
- `app/exam/[slug]/page.tsx` — màn hình nhập tên (screenshot 1).
- `app/exam/[slug]/intro/page.tsx` — màn hình giới thiệu đề thi (screenshot 2).
- `app/exam/[slug]/take/page.tsx` — màn hình làm bài + timer + navigator (screenshot 3).
- `app/exam/[slug]/result/page.tsx` — thông báo hoàn thành + xem điểm + subscribe.
- `app/api/exams/[slug]/start`, `app/api/submissions/[id]/submit`, `app/api/submissions/[id]`, `app/api/exams/[slug]/subscribe`.
- `lib/gemini.ts` — wrapper gọi Gemini (model đổi qua env `GEMINI_MODEL`).

### Giáo viên
- `app/(auth)/login` + `app/auth/callback` — đăng nhập Google OAuth, tự tạo row `teachers`.
- `app/dashboard` — danh sách exam của giáo viên.
- `app/dashboard/new` — tạo exam mới (draft).
- `app/dashboard/[examId]/edit` — exam builder: sửa title/time limit, thêm câu hỏi thủ công, import Excel, popup Share (link + due date + max attempts + show_result_instantly + nút Publish).
- `app/api/exams/[examId]/*` — CRUD exam/settings/questions, `import-excel`.
- `lib/excel-import.ts` — parser đúng theo `exam_import_template.xlsx` đã gửi trước đó.

### Chung
- `lib/supabase/{client,server,admin}.ts` — 3 kiểu client theo đúng phân quyền đã bàn.
- Theme trắng sữa (`#FAF8F3`) / đen off-black (`#1C1B19`) trong Tailwind config.

## Chưa làm (bước tiếp theo)
- Import PDF qua Gemini (`app/api/import/pdf`) — cần upload PDF, gọi Gemini tách câu hỏi theo đúng format template.
- Mail-merge khi publish (`app/api/notify`) — đề xuất dùng Resend, gọi từ nút Publish trong SharePopup.
- Trang xem submissions/chấm tay cho giáo viên (`app/dashboard/[examId]/submissions`).
- Google OAuth cần bật provider trong Supebase Dashboard → Authentication → Providers → Google (điền Client ID/Secret từ Google Cloud Console, redirect URL: `https://<project>.supabase.co/auth/v1/callback`).

## Setup trong Codespace
```bash
npm install
cp .env.example .env.local   # rồi điền Supabase URL/key + Gemini key
npm run dev
```

Điền `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — lấy ở Supabase dashboard > Project Settings > API.
- `SUPABASE_SERVICE_ROLE_KEY` — cùng chỗ, **không** để lộ ra client, chỉ dùng trong API routes.
- `GEMINI_API_KEY` — lấy ở Google AI Studio (free tier cho `gemini-3.1-flash-lite`).

## Test nhanh flow học sinh
1. Trong Supabase, tạo thủ công 1 exam (`status = 'published'`, `share_slug = 'test'`) + vài `questions`.
2. Mở `http://localhost:3000/exam/test` → nhập tên → intro → làm bài → submit → xem kết quả.

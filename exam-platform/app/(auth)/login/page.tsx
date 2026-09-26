"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

export default function LoginPage() {
  const supabase = createClient();

  async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="w-full max-w-sm">
        <h1 className="mb-2 text-2xl font-bold">Exam Platform</h1>
        <p className="mb-8 text-ink-soft">Đăng nhập để tạo và quản lý bài kiểm tra</p>
        <Button className="w-full" onClick={signInWithGoogle}>
          Đăng nhập với Google
        </Button>
      </div>
    </main>
  );
}

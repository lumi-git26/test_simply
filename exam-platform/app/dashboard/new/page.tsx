"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export default function NewExamPage() {
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function create() {
    setLoading(true);
    const res = await fetch("/api/exams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    const data = await res.json();
    router.push(`/dashboard/${data.id}/edit`);
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="w-full max-w-md">
        <h1 className="mb-6 text-2xl font-bold">Tạo bài kiểm tra mới</h1>
        <input
          className="input-field"
          placeholder="Tên bài kiểm tra"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <Button className="mt-4 w-full" disabled={loading || !title.trim()} onClick={create}>
          {loading ? "Đang tạo…" : "Tiếp tục"}
        </Button>
      </div>
    </main>
  );
}

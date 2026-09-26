import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin", "vietnamese"],
  variable: "--font-montserrat",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Exam Platform",
  description: "Create and take exams online",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={montserrat.variable}>
      <body className="min-h-screen bg-paper text-ink antialiased font-sans">{children}</body>
    </html>
  );
}
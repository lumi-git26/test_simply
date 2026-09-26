"use client";

import { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "outline";
};

export function Button({ variant = "primary", className = "", ...props }: Props) {
  const base = variant === "primary" ? "btn-primary" : "btn-outline";
  return <button className={`${base} ${className}`} {...props} />;
}

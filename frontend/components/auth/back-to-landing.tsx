"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export function BackToLanding() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.replace("/")}
      className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
    >
      <ArrowLeft className="h-4 w-4" aria-hidden />
      Back to home
    </button>
  );
}

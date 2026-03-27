"use client";

import { Plus } from "lucide-react";

type AddTripMemberFabProps = {
  onClick: () => void;
};

export function AddTripMemberFab({ onClick }: AddTripMemberFabProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="fixed bottom-6 right-6 z-[60] flex h-16 w-16 items-center justify-center rounded-full border-2 border-primary-foreground/15 bg-primary text-primary-foreground shadow-[0_14px_40px_-8px_rgba(0,0,0,0.45),0_6px_20px_-6px_rgba(0,0,0,0.28),0_0_0_1px_rgba(0,0,0,0.08)] transition duration-200 hover:scale-105 hover:shadow-[0_18px_48px_-8px_rgba(0,0,0,0.5),0_8px_24px_-6px_rgba(0,0,0,0.3)] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:shadow-[0_14px_40px_-8px_rgba(0,0,0,0.65),0_6px_20px_-6px_rgba(0,0,0,0.45),0_0_0_1px_rgba(255,255,255,0.06)]"
      aria-label="Add trip member"
    >
      <Plus className="h-8 w-8" strokeWidth={2.25} />
    </button>
  );
}

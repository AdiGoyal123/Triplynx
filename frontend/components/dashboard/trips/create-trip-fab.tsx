"use client";

import { Plus } from "lucide-react";

type CreateTripFabProps = {
  onClick: () => void;
};

export function CreateTripFab({ onClick }: CreateTripFabProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg ring-offset-background transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      aria-label="Add trip"
    >
      <Plus className="h-7 w-7" strokeWidth={2} />
    </button>
  );
}

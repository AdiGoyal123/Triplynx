"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { TripRow } from "./types";

type TripListItemProps = {
  trip: TripRow;
};

export function TripListItem({ trip }: TripListItemProps) {
  return (
    <li>
      <Link
        href={`/dashboard/trips/${trip.id}`}
        className="flex items-start gap-3 rounded-2xl border border-border/90 bg-card p-4 text-left shadow-md shadow-black/[0.06] ring-1 ring-black/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 sm:gap-4 sm:p-5 dark:bg-card dark:shadow-black/25 dark:ring-white/[0.06]"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
            <div className="min-w-0">
              <p className="text-base font-semibold tracking-tight text-foreground">
                {trip.title}
              </p>
              {trip.description ? (
                <p className="mt-1 line-clamp-2 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                  {trip.description}
                </p>
              ) : null}
            </div>
            <span className="inline-flex w-fit shrink-0 items-center rounded-full border border-border/80 bg-muted/60 px-3 py-1 text-xs font-medium capitalize text-foreground/80">
              {trip.status}
            </span>
          </div>
          <p className="mt-3 text-xs font-medium text-muted-foreground">
            {trip.start_date || "—"} → {trip.end_date || "—"}
            <span className="mx-2 text-border">·</span>
            Added {new Date(trip.created_at).toLocaleString()}
          </p>
        </div>
        <ChevronRight
          className="mt-1 h-5 w-5 shrink-0 text-muted-foreground"
          aria-hidden
        />
      </Link>
    </li>
  );
}

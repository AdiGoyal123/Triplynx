"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { TripRow } from "./types";

type TripListItemProps = {
  trip: TripRow;
};

export function TripListItem({ trip }: TripListItemProps) {
  return (
    <li className="py-4 first:pt-0">
      <Link
        href={`/dashboard/trips/${trip.id}`}
        className="-mx-2 flex items-start gap-2 rounded-xl px-2 py-2 text-left outline-none transition hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-primary"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
            <div className="min-w-0">
              <p className="font-medium text-foreground">{trip.title}</p>
              {trip.description ? (
                <p className="mt-1 line-clamp-2 whitespace-pre-wrap text-sm text-muted-foreground">
                  {trip.description}
                </p>
              ) : null}
            </div>
            <span className="shrink-0 rounded-full border border-border/80 px-2.5 py-0.5 text-xs capitalize text-muted-foreground">
              {trip.status}
            </span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {trip.start_date || "—"} → {trip.end_date || "—"}
            <span className="mx-2 text-border">·</span>
            Added {new Date(trip.created_at).toLocaleString()}
          </p>
        </div>
        <ChevronRight
          className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground"
          aria-hidden
        />
      </Link>
    </li>
  );
}

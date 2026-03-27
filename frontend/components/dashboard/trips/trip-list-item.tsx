"use client";

import type { TripRow } from "./types";

type TripListItemProps = {
  trip: TripRow;
};

export function TripListItem({ trip }: TripListItemProps) {
  return (
    <li className="py-4 first:pt-0">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="font-medium text-foreground">{trip.title}</p>
          {trip.description ? (
            <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{trip.description}</p>
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
    </li>
  );
}

"use client";

import type { TripRow } from "./types";
import { TripListItem } from "./trip-list-item";

type TripListProps = {
  trips: TripRow[];
  loading: boolean;
  error: string | null;
};

export function TripList({ trips, loading, error }: TripListProps) {
  return (
    <section className="rounded-2xl border border-border/80 bg-background/80 p-4 shadow-sm shadow-black/5 ring-1 ring-black/[0.04] backdrop-blur-sm sm:p-6 dark:ring-white/[0.06] dark:shadow-black/20">
      <h2 className="text-lg font-semibold text-foreground">Your trips</h2>
      <p className="mt-1 text-sm text-muted-foreground">Trips you created, newest first.</p>

      {loading ? (
        <p className="mt-6 text-sm text-muted-foreground">Loading your trips…</p>
      ) : error ? (
        <p className="mt-6 text-sm text-red-500">{error}</p>
      ) : trips.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">
          You don&apos;t have any trips yet. Tap the + button to create your first trip.
        </p>
      ) : (
        <ul className="mt-6 flex list-none flex-col gap-4 p-0">
          {trips.map((trip) => (
            <TripListItem key={trip.id} trip={trip} />
          ))}
        </ul>
      )}
    </section>
  );
}

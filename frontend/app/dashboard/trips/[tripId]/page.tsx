"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageIntro } from "@/components/dashboard/PageIntro";
import { TripParticipantsPanel } from "@/components/dashboard/trips/trip-participants-panel";
import { useMyTrips } from "@/components/dashboard/trips/use-my-trips";

export default function TripDetailPage() {
  const params = useParams();
  const tripId =
    typeof params.tripId === "string" ? params.tripId : Array.isArray(params.tripId) ? params.tripId[0] ?? "" : "";

  const { trips, loading } = useMyTrips();
  const trip = trips.find((t) => t.id === tripId);

  const title = trip?.title ?? (tripId ? "Trip" : "Trip");
  const description = trip
    ? [
        trip.description?.trim() || null,
        trip.start_date && trip.end_date ? `${trip.start_date} → ${trip.end_date}` : null,
        trip.status ? `Status: ${trip.status}` : null,
      ]
        .filter(Boolean)
        .join(" · ")
    : loading
      ? "Loading trip details…"
      : "This trip could not be found in your list. It may have been removed or the link is invalid.";

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/trips"
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back to trips
      </Link>

      <PageIntro title={title} description={description} />

      <TripParticipantsPanel tripId={tripId} />
    </div>
  );
}

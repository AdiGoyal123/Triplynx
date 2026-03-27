"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageIntro } from "@/components/dashboard/PageIntro";
import { AddTripMemberFab } from "@/components/dashboard/trips/add-trip-member-fab";
import { AddTripMemberModal } from "@/components/dashboard/trips/add-trip-member-modal";
import { TripParticipantsPanel } from "@/components/dashboard/trips/trip-participants-panel";
import { useMyTrips } from "@/components/dashboard/trips/use-my-trips";

export default function TripDetailPage() {
  const params = useParams();
  const tripId =
    typeof params.tripId === "string" ? params.tripId : Array.isArray(params.tripId) ? params.tripId[0] ?? "" : "";

  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [membersReload, setMembersReload] = useState(0);

  const closeAddMember = useCallback(() => {
    setAddMemberOpen(false);
  }, []);

  const onMemberAdded = useCallback(() => {
    setMembersReload((n) => n + 1);
  }, []);

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
    <div className="relative space-y-6 pb-28">
      <Link
        href="/dashboard/trips"
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back to trips
      </Link>

      <PageIntro title={title} description={description} />

      <TripParticipantsPanel tripId={tripId} reloadSignal={membersReload} />

      <section className="rounded-2xl border border-border/70 bg-background p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-foreground">Surveys</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Surveys/Polls for this trip will appear here soon 🔜
        </p>
        <div className="mt-5">
          <button
            type="button"
            disabled
            className="inline-flex h-10 cursor-not-allowed items-center rounded-lg border border-border/80 bg-muted/40 px-4 text-sm font-medium text-muted-foreground"
          >
            Create survey
          </button>
        </div>
      </section>

      {tripId.trim() ? (
        <>
          <AddTripMemberFab onClick={() => setAddMemberOpen(true)} />
          <AddTripMemberModal
            tripId={tripId}
            open={addMemberOpen}
            onClose={closeAddMember}
            onAdded={onMemberAdded}
          />
        </>
      ) : null}
    </div>
  );
}

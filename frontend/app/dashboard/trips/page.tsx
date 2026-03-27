"use client";

import { useCallback, useState } from "react";
import { PageIntro } from "@/components/dashboard/PageIntro";
import { CreateTripFab } from "@/components/dashboard/trips/create-trip-fab";
import { CreateTripModal } from "@/components/dashboard/trips/create-trip-modal";
import { TripList } from "@/components/dashboard/trips/trip-list";
import { useMyTrips } from "@/components/dashboard/trips/use-my-trips";

export default function TripsPage() {
  const { trips, loading, error, refresh } = useMyTrips();
  const [createOpen, setCreateOpen] = useState(false);

  const closeCreate = useCallback(() => {
    setCreateOpen(false);
  }, []);

  return (
    <div className="relative space-y-6 pb-28">
      <PageIntro
        title="Trips"
        description="Your trips, newest first. Use the + button to add one."
      />

      <TripList trips={trips} loading={loading} error={error} />

      <CreateTripFab onClick={() => setCreateOpen(true)} />

      <CreateTripModal open={createOpen} onClose={closeCreate} onCreated={refresh} />
    </div>
  );
}

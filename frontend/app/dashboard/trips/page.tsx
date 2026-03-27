"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Plus, X } from "lucide-react";
import { PageIntro } from "@/components/dashboard/PageIntro";
import { getSupabaseClient } from "@/lib/supabase/client";

type TripRow = {
  id: string;
  title: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  status: string;
  created_at: string;
};

type TripForm = {
  title: string;
  startDate: string;
  endDate: string;
  description: string;
};

const initialForm: TripForm = {
  title: "",
  startDate: "",
  endDate: "",
  description: "",
};

export default function TripsPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [form, setForm] = useState<TripForm>(initialForm);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [trips, setTrips] = useState<TripRow[]>([]);
  const [tripsLoading, setTripsLoading] = useState(true);
  const [tripsError, setTripsError] = useState<string | null>(null);

  const loadMyTrips = useCallback(async () => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      setTripsError(
        "Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY.",
      );
      setTrips([]);
      setTripsLoading(false);
      return;
    }

    setTripsLoading(true);
    setTripsError(null);

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) {
      setTripsError(userError.message);
      setTrips([]);
      setTripsLoading(false);
      return;
    }

    if (!userData.user?.id) {
      setTripsError("Sign in to see your trips.");
      setTrips([]);
      setTripsLoading(false);
      return;
    }

    const { data, error: listError } = await supabase
      .from("trips")
      .select("id, title, description, start_date, end_date, status, created_at")
      .eq("created_by", userData.user.id)
      .order("created_at", { ascending: false });

    if (listError) {
      setTripsError(listError.message);
      setTrips([]);
    } else {
      setTrips((data as TripRow[]) ?? []);
    }
    setTripsLoading(false);
  }, []);

  useEffect(() => {
    void loadMyTrips();
  }, [loadMyTrips]);

  useEffect(() => {
    if (!isCreateOpen) {
      return;
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsCreateOpen(false);
        setForm(initialForm);
        setError(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [isCreateOpen]);

  const closeCreateModal = () => {
    setIsCreateOpen(false);
    setForm(initialForm);
    setError(null);
  };

  const hasDateRangeError = useMemo(() => {
    if (!form.startDate || !form.endDate) {
      return false;
    }
    return new Date(form.endDate) < new Date(form.startDate);
  }, [form.endDate, form.startDate]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!form.title.trim()) {
      setError("Trip title is required.");
      return;
    }

    if (hasDateRangeError) {
      setError("End date cannot be before start date.");
      return;
    }

    const supabase = getSupabaseClient();

    if (!supabase) {
      setError(
        "Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY."
      );
      return;
    }

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) {
      setError(userError.message);
      return;
    }

    if (!userData.user?.id) {
      setError("You must be logged in to create a trip.");
      return;
    }

    setIsSaving(true);
    const { data, error: createTripError } = await supabase.functions.invoke("create-trip", {
      body: {
        title: form.title.trim(),
        description: form.description.trim() || null,
        start_date: form.startDate || null,
        end_date: form.endDate || null,
        status: "planning",
        created_by: userData.user.id,
      },
    });
    setIsSaving(false);

    if (createTripError) {
      setError(createTripError.message);
      return;
    }

    if (data?.error) {
      setError(data.error);
      return;
    }

    void loadMyTrips();
    closeCreateModal();
  };

  return (
    <div className="relative space-y-6 pb-24">
      <PageIntro
        title="Trips"
        description="Your trips, newest first. Use the + button to add one."
      />

      <section className="rounded-2xl border border-border/70 bg-background p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-foreground">Your trips</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Trips you created, newest first.
        </p>

        {tripsLoading ? (
          <p className="mt-6 text-sm text-muted-foreground">Loading your trips…</p>
        ) : tripsError ? (
          <p className="mt-6 text-sm text-red-500">{tripsError}</p>
        ) : trips.length === 0 ? (
          <p className="mt-6 text-sm text-muted-foreground">
            You don&apos;t have any trips yet. Tap the + button to create your first trip.
          </p>
        ) : (
          <ul className="mt-6 divide-y divide-border/60">
            {trips.map((trip) => (
              <li key={trip.id} className="py-4 first:pt-0">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-medium text-foreground">{trip.title}</p>
                    {trip.description ? (
                      <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
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
              </li>
            ))}
          </ul>
        )}
      </section>

      <button
        type="button"
        onClick={() => {
          setError(null);
          setIsCreateOpen(true);
        }}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg ring-offset-background transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        aria-label="Add trip"
      >
        <Plus className="h-7 w-7" strokeWidth={2} />
      </button>

      {isCreateOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
          <button
            type="button"
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            aria-label="Close dialog"
            onClick={closeCreateModal}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-trip-title"
            className="relative z-10 flex max-h-[min(90vh,640px)] w-full max-w-lg flex-col rounded-2xl border border-border/70 bg-background shadow-xl"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b border-border/60 px-5 py-4">
              <div>
                <h2 id="create-trip-title" className="text-lg font-semibold text-foreground">
                  Create a new trip
                </h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Add details below. Status starts as planning.
                </p>
              </div>
              <button
                type="button"
                onClick={closeCreateModal}
                className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              className="grid max-h-full gap-4 overflow-y-auto p-5 sm:grid-cols-2"
              onSubmit={onSubmit}
            >
              <label className="grid gap-1 sm:col-span-2">
                <span className="text-sm font-medium">Trip title</span>
                <input
                  className="h-10 rounded-lg border border-border/80 bg-background px-3 text-sm outline-none ring-offset-background transition placeholder:text-muted-foreground focus:ring-2 focus:ring-primary"
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Summer Europe 2026"
                />
              </label>

              <label className="grid gap-1">
                <span className="text-sm font-medium">Start date</span>
                <input
                  type="date"
                  className="h-10 rounded-lg border border-border/80 bg-background px-3 text-sm outline-none ring-offset-background transition focus:ring-2 focus:ring-primary"
                  value={form.startDate}
                  onChange={(e) => setForm((prev) => ({ ...prev, startDate: e.target.value }))}
                />
              </label>

              <label className="grid gap-1">
                <span className="text-sm font-medium">End date</span>
                <input
                  type="date"
                  className="h-10 rounded-lg border border-border/80 bg-background px-3 text-sm outline-none ring-offset-background transition focus:ring-2 focus:ring-primary"
                  value={form.endDate}
                  onChange={(e) => setForm((prev) => ({ ...prev, endDate: e.target.value }))}
                />
              </label>

              <label className="grid gap-1 sm:col-span-2">
                <span className="text-sm font-medium">Description (optional)</span>
                <textarea
                  className="min-h-28 rounded-lg border border-border/80 bg-background px-3 py-2 text-sm outline-none ring-offset-background transition placeholder:text-muted-foreground focus:ring-2 focus:ring-primary"
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Any travel preferences or context..."
                />
              </label>

              {error ? <p className="text-sm text-red-500 sm:col-span-2">{error}</p> : null}
              {hasDateRangeError ? (
                <p className="text-sm text-amber-600 sm:col-span-2">
                  Heads up: end date is before start date.
                </p>
              ) : null}

              <div className="flex flex-wrap gap-2 sm:col-span-2">
                <button
                  type="button"
                  onClick={closeCreateModal}
                  className="inline-flex h-10 items-center rounded-lg border border-border/80 bg-background px-4 text-sm font-medium transition hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
                >
                  {isSaving ? "Saving..." : "Create trip"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

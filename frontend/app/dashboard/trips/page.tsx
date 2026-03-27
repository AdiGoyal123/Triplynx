"use client";

import { FormEvent, useMemo, useState } from "react";
import { PageIntro } from "@/components/dashboard/PageIntro";
import { getSupabaseClient } from "@/lib/supabase/client";

type TripForm = {
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  notes: string;
};

const initialForm: TripForm = {
  title: "",
  destination: "",
  startDate: "",
  endDate: "",
  notes: "",
};

export default function TripsPage() {
  const [form, setForm] = useState<TripForm>(initialForm);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const hasDateRangeError = useMemo(() => {
    if (!form.startDate || !form.endDate) {
      return false;
    }
    return new Date(form.endDate) < new Date(form.startDate);
  }, [form.endDate, form.startDate]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

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

    const descriptionSections = [
      form.destination.trim() ? `Destination: ${form.destination.trim()}` : null,
      form.notes.trim() ? `Notes: ${form.notes.trim()}` : null,
    ].filter(Boolean);

    setIsSaving(true);
    const { data, error: createTripError } = await supabase.functions.invoke("create-trip", {
      body: {
        title: form.title.trim(),
        description: descriptionSections.length ? descriptionSections.join("\n") : null,
        start_date: form.startDate || null,
        end_date: form.endDate || null,
        status: "planning",
        created_by: userData.user.id,
      },
    });
    console.log("create-trip function response:", { data, error: createTripError });
    setIsSaving(false);

    if (createTripError) {
      setError(createTripError.message);
      return;
    }

    if (data?.error) {
      setError(data.error);
      return;
    }

    setSuccess("Trip created successfully.");
    setForm(initialForm);
  };

  return (
    <div className="space-y-6">
      <PageIntro title="Trips" description="Create and manage your group trips." />

      <section className="rounded-2xl border border-border/70 bg-background p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-foreground">Create a new trip</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Submit the form to create a trip via the Supabase edge function.
        </p>

        <form className="mt-5 grid gap-4 sm:grid-cols-2" onSubmit={onSubmit}>
          <label className="grid gap-1 sm:col-span-2">
            <span className="text-sm font-medium">Trip title</span>
            <input
              className="h-10 rounded-lg border border-border/80 bg-background px-3 text-sm outline-none ring-offset-background transition placeholder:text-muted-foreground focus:ring-2 focus:ring-primary"
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Summer Europe 2026"
            />
          </label>

          <label className="grid gap-1 sm:col-span-2">
            <span className="text-sm font-medium">Destination</span>
            <input
              className="h-10 rounded-lg border border-border/80 bg-background px-3 text-sm outline-none ring-offset-background transition placeholder:text-muted-foreground focus:ring-2 focus:ring-primary"
              value={form.destination}
              onChange={(e) => setForm((prev) => ({ ...prev, destination: e.target.value }))}
              placeholder="Italy"
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
            <span className="text-sm font-medium">Notes (optional)</span>
            <textarea
              className="min-h-28 rounded-lg border border-border/80 bg-background px-3 py-2 text-sm outline-none ring-offset-background transition placeholder:text-muted-foreground focus:ring-2 focus:ring-primary"
              value={form.notes}
              onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Any travel preferences or context..."
            />
          </label>

          {error ? <p className="text-sm text-red-500 sm:col-span-2">{error}</p> : null}
          {success ? <p className="text-sm text-emerald-600 sm:col-span-2">{success}</p> : null}
          {hasDateRangeError ? (
            <p className="text-sm text-amber-600 sm:col-span-2">
              Heads up: end date is before start date.
            </p>
          ) : null}

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90"
            >
              {isSaving ? "Saving..." : "Create trip"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

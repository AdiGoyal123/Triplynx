"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabase/client";
import { initialTripForm, type TripForm } from "./types";

type CreateTripModalProps = {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
};

const inputClass =
  "h-10 rounded-lg border border-border/80 bg-background px-3 text-sm outline-none ring-offset-background transition placeholder:text-muted-foreground focus:ring-2 focus:ring-primary";

export function CreateTripModal({ open, onClose, onCreated }: CreateTripModalProps) {
  const [form, setForm] = useState<TripForm>(initialTripForm);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const resetAndClose = () => {
    setForm(initialTripForm);
    setError(null);
    onClose();
  };

  useEffect(() => {
    if (!open) {
      return;
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setForm(initialTripForm);
        setError(null);
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

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
        "Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY.",
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

    onCreated();
    resetAndClose();
  };

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        aria-label="Close dialog"
        onClick={resetAndClose}
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
            onClick={resetAndClose}
            className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form className="grid max-h-full gap-4 overflow-y-auto p-5 sm:grid-cols-2" onSubmit={onSubmit}>
          <label className="grid gap-1 sm:col-span-2">
            <span className="text-sm font-medium">Trip title</span>
            <input
              className={inputClass}
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Summer Europe 2026"
            />
          </label>

          <label className="grid gap-1">
            <span className="text-sm font-medium">Start date</span>
            <input
              type="date"
              className={inputClass}
              value={form.startDate}
              onChange={(e) => setForm((prev) => ({ ...prev, startDate: e.target.value }))}
            />
          </label>

          <label className="grid gap-1">
            <span className="text-sm font-medium">End date</span>
            <input
              type="date"
              className={inputClass}
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
              onClick={resetAndClose}
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
  );
}

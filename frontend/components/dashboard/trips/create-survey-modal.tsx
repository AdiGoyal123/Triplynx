"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import {
  initialSurveyForm,
  type Survey,
  type SurveyFormFields,
  type SurveyStatus,
} from "./types";

const PLACEHOLDER_CREATED_BY = "00000000-0000-0000-0000-000000000000";

type CreateSurveyModalProps = {
  tripId: string;
  open: boolean;
  onClose: () => void;
  onCreated: (survey: Survey) => void;
};

const inputClass =
  "h-10 rounded-lg border border-border/80 bg-background px-3 text-sm outline-none ring-offset-background transition placeholder:text-muted-foreground focus:ring-2 focus:ring-primary";

function buildSurvey(tripId: string, form: SurveyFormFields): Survey {
  const now = new Date().toISOString();
  const status: SurveyStatus | null =
    form.status === "" ? null : (form.status as SurveyStatus);
  return {
    id: crypto.randomUUID(),
    created_at: now,
    updated_at: now,
    trip_id: tripId,
    created_by: PLACEHOLDER_CREATED_BY,
    title: form.title.trim(),
    description: form.description.trim() || null,
    opens_at: form.opensAt ? new Date(form.opensAt).toISOString() : null,
    closes_at: form.closesAt ? new Date(form.closesAt).toISOString() : null,
    status,
  };
}

export function CreateSurveyModal({ tripId, open, onClose, onCreated }: CreateSurveyModalProps) {
  const [form, setForm] = useState<SurveyFormFields>(initialSurveyForm);
  const [error, setError] = useState<string | null>(null);

  const resetAndClose = () => {
    setForm(initialSurveyForm);
    setError(null);
    onClose();
  };

  useEffect(() => {
    if (!open) {
      return;
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setForm(initialSurveyForm);
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

  const rangeError = useMemo(() => {
    if (!form.opensAt || !form.closesAt) {
      return false;
    }
    return new Date(form.closesAt) < new Date(form.opensAt);
  }, [form.closesAt, form.opensAt]);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!tripId.trim()) {
      setError("Missing trip.");
      return;
    }

    if (!form.title.trim()) {
      setError("Title is required.");
      return;
    }

    if (rangeError) {
      setError("Close time cannot be before open time.");
      return;
    }

    onCreated(buildSurvey(tripId, form));
    setForm(initialSurveyForm);
    onClose();
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
        aria-labelledby="create-survey-title"
        className="relative z-10 flex max-h-[min(90vh,640px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border/70 bg-background shadow-xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-border/60 px-5 py-4">
          <div>
            <h2 id="create-survey-title" className="text-lg font-semibold text-foreground">
              Create survey
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Local preview only — not saved to the server yet.
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

        <form className="grid max-h-full gap-4 overflow-y-auto p-5" onSubmit={onSubmit}>
          <label className="grid gap-1">
            <span className="text-sm font-medium">Title</span>
            <input
              className={inputClass}
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              placeholder="Weekend activity poll"
              required
            />
          </label>

          <label className="grid gap-1">
            <span className="text-sm font-medium">Description (optional)</span>
            <textarea
              className="min-h-24 rounded-lg border border-border/80 bg-background px-3 py-2 text-sm outline-none ring-offset-background transition placeholder:text-muted-foreground focus:ring-2 focus:ring-primary"
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="What should the group vote on?"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1">
              <span className="text-sm font-medium">Opens at (optional)</span>
              <input
                type="datetime-local"
                className={inputClass}
                value={form.opensAt}
                onChange={(e) => setForm((p) => ({ ...p, opensAt: e.target.value }))}
              />
            </label>
            <label className="grid gap-1">
              <span className="text-sm font-medium">Closes at (optional)</span>
              <input
                type="datetime-local"
                className={inputClass}
                value={form.closesAt}
                onChange={(e) => setForm((p) => ({ ...p, closesAt: e.target.value }))}
              />
            </label>
          </div>

          <label className="grid gap-1">
            <span className="text-sm font-medium">Status (optional)</span>
            <select
              className={inputClass}
              value={form.status}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  status: e.target.value as SurveyFormFields["status"],
                }))
              }
            >
              <option value="">— None —</option>
              <option value="draft">draft</option>
              <option value="ongoing">ongoing</option>
              <option value="closed">closed</option>
            </select>
          </label>

          {error ? <p className="text-sm text-red-500">{error}</p> : null}
          {rangeError ? (
            <p className="text-sm text-amber-600">Close time is before open time.</p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={resetAndClose}
              className="inline-flex h-10 items-center rounded-lg border border-border/80 bg-background px-4 text-sm font-medium transition hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90"
            >
              Add survey
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

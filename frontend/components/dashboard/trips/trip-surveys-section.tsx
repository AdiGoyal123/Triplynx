"use client";

import { useCallback, useState } from "react";
import { CreateSurveyModal } from "./create-survey-modal";
import type { Survey, SurveyOption } from "./types";
import { useTripSurveys } from "./use-trip-surveys";

type TripSurveysSectionProps = {
  tripId: string;
};

function formatWhen(iso: string | null) {
  if (!iso) {
    return "—";
  }
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

function parseIsoMs(iso: string | null): number | null {
  if (!iso) {
    return null;
  }
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? null : t;
}

/** Human-readable duration for “in X” / “X left”. */
function formatDurationRough(ms: number): string {
  const abs = Math.abs(ms);
  const minutes = Math.floor(abs / 60_000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) {
    return `${days} day${days === 1 ? "" : "s"}`;
  }
  if (hours > 0) {
    return `${hours} hour${hours === 1 ? "" : "s"}`;
  }
  if (minutes > 0) {
    return `${minutes} minute${minutes === 1 ? "" : "s"}`;
  }
  return "less than a minute";
}

function surveyScheduleContext(s: Survey): {
  scheduleLine: string;
  highlight: string | null;
  highlightTone: "muted" | "live" | "done";
} {
  const now = Date.now();
  const openMs = parseIsoMs(s.opens_at);
  const closeMs = parseIsoMs(s.closes_at);

  if (openMs === null || closeMs === null) {
    return {
      scheduleLine: "Schedule not available.",
      highlight: null,
      highlightTone: "muted",
    };
  }

  if (now < openMs) {
    return {
      scheduleLine: `Opens ${formatWhen(s.opens_at)} · Closes ${formatWhen(s.closes_at)}`,
      highlight: `Opens in ${formatDurationRough(openMs - now)}`,
      highlightTone: "muted",
    };
  }

  if (now >= closeMs) {
    return {
      scheduleLine: `Voting was open ${formatWhen(s.opens_at)} – ${formatWhen(s.closes_at)}`,
      highlight: "Voting has ended",
      highlightTone: "done",
    };
  }

  return {
    scheduleLine: `Voting open ${formatWhen(s.opens_at)} – ${formatWhen(s.closes_at)}`,
    highlight: `${formatDurationRough(closeMs - now)} left to respond`,
    highlightTone: "live",
  };
}

function formatStatusLabel(status: Survey["status"]): string {
  if (!status) {
    return "Unset";
  }
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function SurveyChoices({ options }: { options: SurveyOption[] }) {
  if (options.length === 0) {
    return <p className="mt-3 text-sm text-muted-foreground">No answer choices listed yet.</p>;
  }
  return (
    <div className="mt-3">
      <p className="text-xs font-medium text-muted-foreground">Choices</p>
      <ul className="mt-1.5 list-inside list-disc space-y-1 text-sm text-foreground">
        {options.map((o) => (
          <li key={o.id}>{o.label ?? o.value ?? "—"}</li>
        ))}
      </ul>
    </div>
  );
}

function statusBadgeClass(status: Survey["status"]) {
  if (status === "ongoing") {
    return "bg-emerald-500/15 text-emerald-900 dark:text-emerald-100";
  }
  if (status === "closed") {
    return "bg-muted text-muted-foreground";
  }
  if (status === "draft") {
    return "bg-amber-500/15 text-amber-950 dark:text-amber-100";
  }
  return "bg-muted/60 text-muted-foreground";
}

export function TripSurveysSection({ tripId }: TripSurveysSectionProps) {
  const { surveys, loading, error: loadError, refresh } = useTripSurveys(tripId);
  const [createOpen, setCreateOpen] = useState(false);

  const onSurveyCreated = useCallback(() => {
    void refresh();
  }, [refresh]);

  if (!tripId.trim()) {
    return null;
  }

  return (
    <>
      <section className="rounded-2xl border border-border/70 bg-background p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Surveys</h2>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Ask the group a question, set voting times, and see how long participants have left to respond.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="inline-flex h-10 shrink-0 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90"
          >
            Create survey
          </button>
        </div>

        {loadError ? <p className="mt-6 text-sm text-red-500">{loadError}</p> : null}
        {loading ? (
          <p className="mt-6 text-sm text-muted-foreground">Loading surveys…</p>
        ) : !loadError && surveys.length === 0 ? (
          <p className="mt-6 text-sm text-muted-foreground">
            No surveys yet. Create one to collect votes from the group.
          </p>
        ) : !loadError ? (
          <ul className="mt-6 divide-y divide-border/60 border-t border-border/60 pt-6">
            {surveys.map((s) => {
              const { scheduleLine, highlight, highlightTone } = surveyScheduleContext(s);
              const highlightClass =
                highlightTone === "live"
                  ? "text-emerald-700 dark:text-emerald-300"
                  : highlightTone === "done"
                    ? "text-muted-foreground"
                    : "text-foreground/90";
              return (
                <li key={s.id} className="py-5 first:pt-2">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Question</p>
                      <p className="mt-0.5 text-base font-semibold leading-snug text-foreground">{s.title}</p>
                    </div>
                    <span
                      className={`inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadgeClass(s.status)}`}
                    >
                      {formatStatusLabel(s.status)}
                    </span>
                  </div>
                  {s.description?.trim() ? (
                    <p className="mt-2 text-sm text-muted-foreground">{s.description.trim()}</p>
                  ) : null}
                  <p className="mt-3 text-sm text-muted-foreground">{scheduleLine}</p>
                  {highlight ? (
                    <p className={`mt-1 text-sm font-medium ${highlightClass}`}>{highlight}</p>
                  ) : null}
                  <SurveyChoices options={s.options} />
                </li>
              );
            })}
          </ul>
        ) : null}
      </section>

      <CreateSurveyModal
        tripId={tripId}
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={onSurveyCreated}
      />
    </>
  );
}

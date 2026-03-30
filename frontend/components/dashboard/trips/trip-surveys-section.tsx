"use client";

import { useCallback, useState } from "react";
import {
  CalendarRange,
  ClipboardList,
  Clock,
  ListChecks,
  MessageSquareText,
  Plus,
} from "lucide-react";
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
  subHighlight: string | null;
  highlightTone: "muted" | "live" | "done" | "draftWindow";
} {
  const now = Date.now();
  const openMs = parseIsoMs(s.opens_at);
  const closeMs = parseIsoMs(s.closes_at);

  if (openMs === null || closeMs === null) {
    return {
      scheduleLine: "No voting window set for this survey yet.",
      highlight: null,
      subHighlight: null,
      highlightTone: "muted",
    };
  }

  if (now < openMs) {
    return {
      scheduleLine: `Starts ${formatWhen(s.opens_at)} · Ends ${formatWhen(s.closes_at)}`,
      highlight: `Starting in ${formatDurationRough(openMs - now)}`,
      subHighlight: null,
      highlightTone: "muted",
    };
  }

  if (now >= closeMs) {
    return {
      scheduleLine: `Window was ${formatWhen(s.opens_at)} – ${formatWhen(s.closes_at)}`,
      highlight: "This survey has ended",
      subHighlight: null,
      highlightTone: "done",
    };
  }

  if (s.status === "draft") {
    return {
      scheduleLine: `Scheduled ${formatWhen(s.opens_at)} – ${formatWhen(s.closes_at)}`,
      highlight: "Draft — not collecting responses yet",
      subHighlight: `Would close in ${formatDurationRough(closeMs - now)} if published as Ongoing`,
      highlightTone: "draftWindow",
    };
  }

  return {
    scheduleLine: `Live ${formatWhen(s.opens_at)} – ${formatWhen(s.closes_at)}`,
    highlight: `${formatDurationRough(closeMs - now)} left to respond`,
    subHighlight: null,
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
    return (
      <div className="mt-4 rounded-lg border border-dashed border-border/80 bg-muted/20 px-4 py-3 text-center sm:text-left">
        <p className="text-sm text-muted-foreground">No answer choices yet — edit the survey to add options.</p>
      </div>
    );
  }
  return (
    <div className="mt-4 rounded-lg border border-border/60 bg-muted/25 px-4 py-3">
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <ListChecks className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
        <span>Answer choices</span>
      </div>
      <ul className="mt-2.5 space-y-2">
        {options.map((o, i) => (
          <li
            key={o.id}
            className="flex gap-2.5 text-sm leading-snug text-foreground"
          >
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-background text-[10px] font-semibold text-muted-foreground ring-1 ring-border/80">
              {i + 1}
            </span>
            <span className="min-w-0 pt-0.5">{o.label ?? o.value ?? "—"}</span>
          </li>
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
      <section className="overflow-hidden rounded-2xl border border-border/70 bg-background shadow-sm ring-1 ring-black/[0.03] dark:ring-white/[0.06]">
        <div className="border-b border-border/50 bg-gradient-to-b from-muted/40 to-transparent px-4 py-5 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex gap-3.5">
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-inner"
                aria-hidden
              >
                <MessageSquareText className="h-5 w-5" strokeWidth={1.75} />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-semibold tracking-tight text-foreground">Surveys</h2>
                <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted-foreground">
                  Run quick polls with clear windows — participants see when voting closes.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground shadow-md shadow-primary/20 transition hover:opacity-[0.92] active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" strokeWidth={2.25} aria-hidden />
              New survey
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6 sm:pt-5">
          {loadError ? (
            <p className="text-sm text-red-600 dark:text-red-400">{loadError}</p>
          ) : null}
          {loading ? (
            <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
              <span
                className="inline-block size-4 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-primary"
                aria-hidden
              />
              Loading surveys…
            </div>
          ) : !loadError && surveys.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/80 bg-muted/15 px-6 py-10 text-center">
              <ClipboardList className="mx-auto h-10 w-10 text-muted-foreground/50" strokeWidth={1.25} aria-hidden />
              <p className="mt-3 text-sm font-medium text-foreground">No surveys on this trip yet</p>
              <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                Create a survey to ask where to eat, when to meet, or anything the group should vote on.
              </p>
            </div>
          ) : !loadError ? (
            <ul className="grid gap-4">
              {surveys.map((s) => {
                const { scheduleLine, highlight, subHighlight, highlightTone } = surveyScheduleContext(s);
                const highlightClass =
                  highlightTone === "live"
                    ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100"
                    : highlightTone === "draftWindow"
                      ? "border-amber-500/25 bg-amber-500/10 text-amber-950 dark:text-amber-50"
                      : highlightTone === "done"
                        ? "border-border/80 bg-muted/40 text-muted-foreground"
                        : "border-border/80 bg-muted/30 text-foreground";

                return (
                  <li
                    key={s.id}
                    className="group rounded-xl border border-border/70 bg-card/30 p-4 shadow-sm transition hover:border-border hover:shadow-md sm:p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Question
                        </p>
                        <p className="mt-1 text-lg font-semibold leading-snug tracking-tight text-foreground">
                          {s.title}
                        </p>
                      </div>
                      <span
                        className={`inline-flex shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClass(s.status)}`}
                      >
                        {formatStatusLabel(s.status)}
                      </span>
                    </div>
                    {s.description?.trim() ? (
                      <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">{s.description.trim()}</p>
                    ) : null}

                    <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-4">
                      <div className="flex min-w-0 flex-1 gap-2.5 text-sm text-muted-foreground">
                        <CalendarRange
                          className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/70"
                          strokeWidth={1.75}
                          aria-hidden
                        />
                        <p className="leading-relaxed">{scheduleLine}</p>
                      </div>
                      {highlight ? (
                        <div
                          className={`flex shrink-0 flex-col gap-1 rounded-lg border px-3 py-2.5 text-sm font-medium sm:max-w-[min(100%,280px)] ${highlightClass}`}
                        >
                          <span className="flex items-center gap-2">
                            <Clock className="h-3.5 w-3.5 shrink-0 opacity-80" strokeWidth={2} aria-hidden />
                            {highlight}
                          </span>
                          {subHighlight ? (
                            <span className="pl-5 text-xs font-normal opacity-90">{subHighlight}</span>
                          ) : null}
                        </div>
                      ) : null}
                    </div>

                    <SurveyChoices options={s.options} />
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>
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

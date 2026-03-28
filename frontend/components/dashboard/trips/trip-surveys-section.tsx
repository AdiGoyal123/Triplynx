"use client";

import { useCallback, useState } from "react";
import { CreateSurveyModal } from "./create-survey-modal";
import type { Survey } from "./types";

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
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [createOpen, setCreateOpen] = useState(false);

  const onSurveyCreated = useCallback((survey: Survey) => {
    setSurveys((prev) => [survey, ...prev]);
  }, []);

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
              Draft surveys for this trip. Data stays in this browser session until the API is connected.
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

        {surveys.length === 0 ? (
          <p className="mt-6 text-sm text-muted-foreground">No surveys yet. Create one to see the structure here.</p>
        ) : (
          <ul className="mt-6 divide-y divide-border/60 border-t border-border/60 pt-6">
            {surveys.map((s) => (
              <li key={s.id} className="py-4 first:pt-0">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="font-medium text-foreground">{s.title}</p>
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadgeClass(s.status)}`}
                  >
                    {s.status ?? "—"}
                  </span>
                </div>
                {s.description ? (
                  <p className="mt-1 text-sm text-muted-foreground">{s.description}</p>
                ) : null}
                <dl className="mt-3 grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
                  <div>
                    <dt className="inline font-medium text-foreground/80">id</dt>
                    <dd className="mt-0.5 font-mono break-all">{s.id}</dd>
                  </div>
                  <div>
                    <dt className="inline font-medium text-foreground/80">trip_id</dt>
                    <dd className="mt-0.5 font-mono break-all">{s.trip_id}</dd>
                  </div>
                  <div>
                    <dt className="inline font-medium text-foreground/80">created_by</dt>
                    <dd className="mt-0.5 font-mono">{s.created_by}</dd>
                  </div>
                  <div>
                    <dt className="inline font-medium text-foreground/80">created_at</dt>
                    <dd className="mt-0.5">{formatWhen(s.created_at)}</dd>
                  </div>
                  <div>
                    <dt className="inline font-medium text-foreground/80">updated_at</dt>
                    <dd className="mt-0.5">{formatWhen(s.updated_at)}</dd>
                  </div>
                  <div>
                    <dt className="inline font-medium text-foreground/80">opens_at</dt>
                    <dd className="mt-0.5">{formatWhen(s.opens_at)}</dd>
                  </div>
                  <div>
                    <dt className="inline font-medium text-foreground/80">closes_at</dt>
                    <dd className="mt-0.5">{formatWhen(s.closes_at)}</dd>
                  </div>
                </dl>
              </li>
            ))}
          </ul>
        )}
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

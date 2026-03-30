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

function SurveyOptionsPreview({ options }: { options: SurveyOption[] }) {
  if (options.length === 0) {
    return (
      <p className="mt-4 text-xs text-muted-foreground">
        <span className="font-medium text-foreground/80">survey_options:</span> none
      </p>
    );
  }
  return (
    <div className="mt-4">
      <p className="text-xs font-medium text-foreground/80">survey_options</p>
      <ul className="mt-2 space-y-2 rounded-lg border border-border/50 bg-muted/15 p-3">
        {options.map((o) => (
          <li key={o.id} className="text-xs text-muted-foreground">
            <p className="text-sm text-foreground">{o.label ?? o.value ?? "—"}</p>
            <div className="mt-1 font-mono text-[10px] leading-relaxed opacity-90">
              id {o.id} · survey_id {o.survey_id} · metadata {JSON.stringify(o.metadata)}
            </div>
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
      <section className="rounded-2xl border border-border/70 bg-background p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Surveys</h2>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Surveys for this trip load from your database (new surveys are created via the create-survey Edge
              Function).
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
          <p className="mt-6 text-sm text-muted-foreground">No surveys yet. Create one to see the structure here.</p>
        ) : !loadError ? (
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

                <SurveyOptionsPreview options={s.options} />
              </li>
            ))}
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

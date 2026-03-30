"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabase/client";
import {
  initialSurveyForm,
  MAX_SURVEY_OPTIONS,
  newSurveyOptionDraft,
  type Survey,
  type SurveyFormFields,
  type SurveyOption,
  type SurveyOptionDraft,
  type SurveyStatus,
} from "./types";

export type CreateSurveyWhatsappSummary = {
  members_with_phone: number;
  sent: number;
  failed: Array<{ phone: string; error?: string }>;
};

type CreateSurveyModalProps = {
  tripId: string;
  open: boolean;
  onClose: () => void;
  onCreated?: (survey: Survey, meta?: { whatsapp_notifications?: CreateSurveyWhatsappSummary }) => void;
};

const inputClass =
  "h-10 rounded-lg border border-border/80 bg-background px-3 text-sm outline-none ring-offset-background transition placeholder:text-muted-foreground focus:ring-2 focus:ring-primary";

/** Allow ~1 minute slack so "now" in datetime-local isn't rejected by skew. */
const OPEN_TIME_SLACK_MS = 60_000;

const HOURS_DEFAULT_WINDOW = 24;

function resolveSurveySchedule(
  form: SurveyFormFields,
):
  | { ok: true; opens_at: string; closes_at: string }
  | { ok: false; message: string } {
  const o = form.opensAt?.trim() ?? "";
  const c = form.closesAt?.trim() ?? "";

  if (!o && !c) {
    const start = new Date();
    const end = new Date(start.getTime() + HOURS_DEFAULT_WINDOW * 60 * 60 * 1000);
    return { ok: true, opens_at: start.toISOString(), closes_at: end.toISOString() };
  }

  if (!o || !c) {
    return {
      ok: false,
      message:
        "Set both Opens at and Closes at, or leave both blank. If both are blank, the survey runs from now through 24 hours from now.",
    };
  }

  const openMs = new Date(o).getTime();
  const closeMs = new Date(c).getTime();
  if (Number.isNaN(openMs) || Number.isNaN(closeMs)) {
    return { ok: false, message: "Invalid date or time." };
  }

  const now = Date.now();
  if (openMs < now - OPEN_TIME_SLACK_MS) {
    return { ok: false, message: "Opens at must be now or in the future." };
  }
  if (closeMs <= openMs) {
    return { ok: false, message: "Closes at must be strictly after opens at." };
  }

  return { ok: true, opens_at: new Date(o).toISOString(), closes_at: new Date(c).toISOString() };
}

/** Prefer JSON `message` / `error` from the Edge Function body over the generic invoke error string. */
async function messageFromEdgeFunctionFailure(err: unknown, response?: Response): Promise<string> {
  if (response) {
    try {
      const contentType = response.headers.get("Content-Type") ?? "";
      if (contentType.includes("application/json")) {
        const body: unknown = await response.json();
        if (body && typeof body === "object") {
          const o = body as Record<string, unknown>;
          if (typeof o.message === "string" && o.message.trim()) {
            return o.message.trim();
          }
          if (typeof o.error === "string" && o.error.trim()) {
            return o.error.trim();
          }
        }
      } else {
        const text = (await response.text()).trim();
        if (text) {
          return text;
        }
      }
    } catch {
      /* use fallback below */
    }
  }
  if (err instanceof Error && err.message) {
    return err.message;
  }
  return "Request failed.";
}

function surveyOptionFromApi(row: unknown): SurveyOption {
  const r = row as Record<string, unknown>;
  const meta = r.metadata;
  return {
    id: String(r.id),
    created_at: String(r.created_at),
    survey_id: String(r.survey_id),
    label: r.label != null ? String(r.label) : null,
    value: r.value != null ? String(r.value) : null,
    metadata:
      meta && typeof meta === "object" && !Array.isArray(meta)
        ? (meta as Record<string, unknown>)
        : {},
    updated_at: r.updated_at != null ? String(r.updated_at) : null,
  };
}

function surveyFromCreateResponse(raw: unknown): Survey | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }
  const s = raw as Record<string, unknown>;
  if (typeof s.id !== "string" || typeof s.trip_id !== "string") {
    return null;
  }
  const optionsRaw = Array.isArray(s.options) ? s.options : [];
  const statusVal = s.status;
  const status: SurveyStatus | null =
    statusVal === "draft" ||
    statusVal === "scheduled" ||
    statusVal === "ongoing" ||
    statusVal === "closed"
      ? statusVal
      : null;
  return {
    id: s.id,
    created_at: String(s.created_at),
    updated_at: String(s.updated_at),
    trip_id: s.trip_id,
    created_by: String(s.created_by),
    title: String(s.title),
    description: s.description != null ? String(s.description) : null,
    opens_at: s.opens_at != null ? String(s.opens_at) : null,
    closes_at: s.closes_at != null ? String(s.closes_at) : null,
    status,
    options: optionsRaw.map(surveyOptionFromApi),
  };
}

function buildSurveyOptions(surveyId: string, rows: SurveyOptionDraft[], timestamp: string): SurveyOption[] {
  return rows
    .filter((r) => r.text.trim())
    .map((r) => {
      const t = r.text.trim();
      return {
        id: crypto.randomUUID(),
        created_at: timestamp,
        survey_id: surveyId,
        label: t,
        value: t,
        metadata: {},
        updated_at: timestamp,
      };
    });
}

/** Status is derived from opens_at only: starts now (within slack) → ongoing, else scheduled. */
function deriveSurveyStatusFromOpensAt(opensAtIso: string): SurveyStatus {
  const openMs = new Date(opensAtIso).getTime();
  if (Number.isNaN(openMs)) {
    return "scheduled";
  }
  return openMs <= Date.now() + OPEN_TIME_SLACK_MS ? "ongoing" : "scheduled";
}

function buildSurvey(
  tripId: string,
  form: SurveyFormFields,
  createdBy: string,
  schedule: { opens_at: string; closes_at: string },
): Survey {
  const now = new Date().toISOString();
  const status = deriveSurveyStatusFromOpensAt(schedule.opens_at);
  const id = crypto.randomUUID();
  return {
    id,
    created_at: now,
    updated_at: now,
    trip_id: tripId,
    created_by: createdBy,
    title: form.title.trim(),
    description: form.description.trim() || null,
    opens_at: schedule.opens_at,
    closes_at: schedule.closes_at,
    status,
    options: buildSurveyOptions(id, form.optionRows, now),
  };
}

export function CreateSurveyModal({ tripId, open, onClose, onCreated }: CreateSurveyModalProps) {
  const [form, setForm] = useState<SurveyFormFields>(initialSurveyForm);
  const [error, setError] = useState<string | null>(null);
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const resetAndClose = () => {
    setForm(initialSurveyForm);
    setError(null);
    setServerMessage(null);
    setSubmitting(false);
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
        setServerMessage(null);
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

  const scheduleWarnings = useMemo(() => {
    const o = form.opensAt?.trim() ?? "";
    const c = form.closesAt?.trim() ?? "";
    if (!o && !c) {
      return null;
    }
    if (!o || !c) {
      return "Fill both times, or clear both to use the default window (now → 24 hours from now).";
    }
    const openMs = new Date(o).getTime();
    const closeMs = new Date(c).getTime();
    if (Number.isNaN(openMs) || Number.isNaN(closeMs)) {
      return null;
    }
    if (openMs < Date.now() - OPEN_TIME_SLACK_MS) {
      return "Opens at should be now or in the future.";
    }
    if (closeMs <= openMs) {
      return "Closes at must be strictly after opens at.";
    }
    return null;
  }, [form.closesAt, form.opensAt]);

  const addOptionRow = () => {
    setForm((p) => {
      if (p.optionRows.length >= MAX_SURVEY_OPTIONS) return p;
      return { ...p, optionRows: [...p.optionRows, newSurveyOptionDraft()] };
    });
  };

  const removeOptionRow = (clientKey: string) => {
    setForm((p) => ({
      ...p,
      optionRows: p.optionRows.filter((r) => r.clientKey !== clientKey),
    }));
  };

  const updateOptionRow = (clientKey: string, patch: Partial<Pick<SurveyOptionDraft, "text">>) => {
    setForm((p) => ({
      ...p,
      optionRows: p.optionRows.map((r) => (r.clientKey === clientKey ? { ...r, ...patch } : r)),
    }));
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setServerMessage(null);

    if (!tripId.trim()) {
      setError("Missing trip.");
      return;
    }

    if (!form.title.trim()) {
      setError("Title is required.");
      return;
    }

    const filledOptionCount = form.optionRows.filter((r) => r.text.trim()).length;
    if (filledOptionCount > MAX_SURVEY_OPTIONS) {
      setError(`You can add at most ${MAX_SURVEY_OPTIONS} options.`);
      return;
    }

    const schedule = resolveSurveySchedule(form);
    if (!schedule.ok) {
      setError(schedule.message);
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
      setError("You must be logged in to create a survey.");
      return;
    }

    const survey = buildSurvey(tripId, form, userData.user.id, schedule);

    setSubmitting(true);
    try {
      const { data, error: invokeError, response: fnResponse } = await supabase.functions.invoke(
        "create-survey",
        {
          body: survey,
        },
      );

      if (invokeError) {
        setError(await messageFromEdgeFunctionFailure(invokeError, fnResponse));
        return;
      }

      if (data && typeof data === "object" && "error" in data && data.error) {
        setError(String(data.error));
        return;
      }

      if (data && typeof data === "object" && "survey" in data) {
        const saved = surveyFromCreateResponse(data.survey);
        if (saved) {
          const rawWhatsapp =
            data && typeof data === "object" && "whatsapp_notifications" in data
              ? (data as { whatsapp_notifications?: unknown }).whatsapp_notifications
              : undefined;
          let whatsappMeta: CreateSurveyWhatsappSummary | undefined;
          if (
            rawWhatsapp &&
            typeof rawWhatsapp === "object" &&
            "members_with_phone" in rawWhatsapp &&
            "sent" in rawWhatsapp &&
            Array.isArray((rawWhatsapp as { failed?: unknown }).failed)
          ) {
            const w = rawWhatsapp as CreateSurveyWhatsappSummary;
            whatsappMeta = {
              members_with_phone: w.members_with_phone,
              sent: w.sent,
              failed: w.failed,
            };
          }
          onCreated?.(saved, whatsappMeta ? { whatsapp_notifications: whatsappMeta } : undefined);
          setForm(initialSurveyForm);
          setServerMessage(null);
          onClose();
          return;
        }
      }

      const messageFromBody =
        data &&
        typeof data === "object" &&
        "message" in data &&
        typeof (data as { message: unknown }).message === "string"
          ? (data as { message: string }).message
          : null;

      setServerMessage(messageFromBody ?? "Request completed.");
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
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
        className="relative z-10 flex max-h-[min(92vh,720px)] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-border/70 bg-background shadow-xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-border/60 px-5 py-4">
          <div>
            <h2 id="create-survey-title" className="text-lg font-semibold text-foreground">
              Create survey
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Submits to your Supabase backend (Edge Function) when you add a survey.
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

        <form className="grid min-h-0 flex-1 gap-4 overflow-y-auto p-5" onSubmit={onSubmit}>
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
              className="min-h-20 rounded-lg border border-border/80 bg-background px-3 py-2 text-sm outline-none ring-offset-background transition placeholder:text-muted-foreground focus:ring-2 focus:ring-primary"
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="What should the group vote on?"
            />
          </label>

          <div className="grid gap-2">
            <p className="text-xs leading-relaxed text-muted-foreground">
              Leave <span className="font-medium text-foreground/90">both</span> times empty to start the survey{" "}
              <span className="font-medium text-foreground/90">now</span> and close it{" "}
              <span className="font-medium text-foreground/90">24 hours from now</span>. If you set a schedule, you
              must fill <span className="font-medium text-foreground/90">both</span> fields: opens at must be now or
              later, and closes at must be strictly after opens at.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1">
                <span className="text-sm font-medium">Opens at</span>
                <input
                  type="datetime-local"
                  className={inputClass}
                  value={form.opensAt}
                  onChange={(e) => setForm((p) => ({ ...p, opensAt: e.target.value }))}
                />
              </label>
              <label className="grid gap-1">
                <span className="text-sm font-medium">Closes at</span>
                <input
                  type="datetime-local"
                  className={inputClass}
                  value={form.closesAt}
                  onChange={(e) => setForm((p) => ({ ...p, closesAt: e.target.value }))}
                />
              </label>
            </div>
          </div>

          <p className="text-xs leading-relaxed text-muted-foreground">
            Status is set automatically: <span className="font-medium text-foreground/90">Ongoing</span> when voting
            starts now (including the default 24-hour window), or{" "}
            <span className="font-medium text-foreground/90">Scheduled</span> when the start time is in the future.
          </p>

          <div className="border-t border-border/60 pt-4">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-foreground">Options (optional)</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Up to {MAX_SURVEY_OPTIONS} choices. Empty rows are ignored.
                </p>
              </div>
              <button
                type="button"
                onClick={addOptionRow}
                disabled={form.optionRows.length >= MAX_SURVEY_OPTIONS}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border/80 bg-background px-3 text-sm font-medium transition hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
              >
                <Plus className="h-4 w-4" aria-hidden />
                Add option
              </button>
            </div>

            {form.optionRows.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">No options yet — add some, or leave empty.</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {form.optionRows.map((row) => (
                  <li
                    key={row.clientKey}
                    className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/20 p-3"
                  >
                    <label className="grid min-w-0 flex-1 gap-1">
                      <span className="text-xs font-medium text-muted-foreground">Option</span>
                      <input
                        className={inputClass}
                        value={row.text}
                        onChange={(e) => updateOptionRow(row.clientKey, { text: e.target.value })}
                        placeholder="e.g. Hyatt downtown"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => removeOptionRow(row.clientKey)}
                      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border/80 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                      aria-label="Remove option"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {error ? <p className="text-sm text-red-500">{error}</p> : null}
          {serverMessage ? (
            <p
              className="rounded-lg border border-border/80 bg-muted/40 px-3 py-2 text-sm text-foreground"
              role="status"
            >
              {serverMessage}
            </p>
          ) : null}
          {scheduleWarnings ? <p className="text-sm text-amber-600">{scheduleWarnings}</p> : null}

          <div className="flex flex-wrap gap-2 border-t border-border/60 pt-2">
            <button
              type="button"
              onClick={resetAndClose}
              disabled={submitting}
              className="inline-flex h-10 items-center rounded-lg border border-border/80 bg-background px-4 text-sm font-medium transition hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:pointer-events-none disabled:opacity-50"
            >
              {submitting ? "Sending…" : "Add survey"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

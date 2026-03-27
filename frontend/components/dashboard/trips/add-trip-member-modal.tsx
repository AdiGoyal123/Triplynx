"use client";

import { FormEvent, useEffect, useState } from "react";
import { X } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabase/client";

type AddTripMemberModalProps = {
  tripId: string;
  open: boolean;
  onClose: () => void;
  onAdded: () => void;
};

const inputClass =
  "h-10 rounded-lg border border-border/80 bg-background px-3 text-sm outline-none ring-offset-background transition placeholder:text-muted-foreground focus:ring-2 focus:ring-primary";

export function AddTripMemberModal({ tripId, open, onClose, onAdded }: AddTripMemberModalProps) {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [whatsappIssue, setWhatsappIssue] = useState<{
    summary: string;
    detail?: string;
  } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const resetAndClose = () => {
    setDisplayName("");
    setEmail("");
    setPhone("");
    setSubmitError(null);
    setWhatsappIssue(null);
    onClose();
  };

  useEffect(() => {
    if (!open) {
      return;
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setDisplayName("");
        setEmail("");
        setPhone("");
        setSubmitError(null);
        setWhatsappIssue(null);
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

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(null);
    setWhatsappIssue(null);

    if (!tripId.trim()) {
      return;
    }

    const dn = displayName.trim() || null;
    const em = email.trim() || null;
    const ph = phone.trim() || null;
    if (!dn && !em && !ph) {
      setSubmitError("At least one of display name, email, or phone is required.");
      return;
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      setSubmitError(
        "Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY.",
      );
      return;
    }

    setIsSaving(true);
    const { data, error: invokeError } = await supabase.functions.invoke("add-trip-member", {
      body: {
        trip_id: tripId,
        display_name: dn,
        email: em,
        phone: ph,
      },
    });
    setIsSaving(false);

    if (invokeError) {
      setSubmitError(invokeError.message);
      return;
    }

    if (data && typeof data === "object" && "error" in data && data.error) {
      setSubmitError(String(data.error));
      return;
    }

    const wa =
      data && typeof data === "object" && "whatsapp_notification" in data
        ? (data as { whatsapp_notification?: { sent?: boolean; error?: string } })
            .whatsapp_notification
        : undefined;
    if (ph && wa && wa.sent === false) {
      const detail = wa.error?.trim();
      setWhatsappIssue({
        summary:
          "WhatsApp invite could not be sent. Check the phone number and that the recipient can receive messages (e.g. Twilio sandbox).",
        ...(detail ? { detail } : {}),
      });
      onAdded();
      return;
    }

    onAdded();
    setDisplayName("");
    setEmail("");
    setPhone("");
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
        aria-labelledby="add-trip-member-title"
        className="relative z-10 flex max-h-[min(90vh,640px)] w-full max-w-lg flex-col rounded-2xl border border-border/70 bg-background shadow-xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-border/60 px-5 py-4">
          <div>
            <h2 id="add-trip-member-title" className="text-lg font-semibold text-foreground">
              Add trip member
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              At least one of display name, email, or phone is required.
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
            <span className="text-sm font-medium">Display name</span>
            <input
              className={inputClass}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Alex Kim"
              autoComplete="name"
              disabled={isSaving}
            />
          </label>

          <label className="grid gap-1">
            <span className="text-sm font-medium">Email</span>
            <input
              type="email"
              className={inputClass}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alex@example.com"
              autoComplete="email"
              disabled={isSaving}
            />
          </label>

          <label className="grid gap-1">
            <span className="text-sm font-medium">Phone</span>
            <input
              type="tel"
              className={inputClass}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 555 0100"
              autoComplete="tel"
              disabled={isSaving}
            />
          </label>

          {submitError ? <p className="text-sm text-red-500 sm:col-span-2">{submitError}</p> : null}

          {whatsappIssue ? (
            <div
              role="status"
              className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-950 dark:text-amber-100 sm:col-span-2"
            >
              <p className="font-medium">Member added</p>
              <p className="mt-1 text-amber-900/90 dark:text-amber-50/90">{whatsappIssue.summary}</p>
              {whatsappIssue.detail ? (
                <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap break-words font-mono text-xs text-amber-900/80 dark:text-amber-50/80">
                  {whatsappIssue.detail}
                </pre>
              ) : null}
            </div>
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
              disabled={!tripId.trim() || isSaving}
              className="inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
            >
              {isSaving ? "Adding…" : "Add member"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

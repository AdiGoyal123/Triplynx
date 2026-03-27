"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { TripMember } from "./types";

type TripParticipantsPanelProps = {
  tripId: string;
};

const inputClass =
  "h-10 rounded-lg border border-border/80 bg-background px-3 text-sm outline-none ring-offset-background transition placeholder:text-muted-foreground focus:ring-2 focus:ring-primary";

const memberSelect =
  "id, trip_id, added_by, display_name, email, phone, created_at, updated_at";

export function TripParticipantsPanel({ tripId }: TripParticipantsPanelProps) {
  const [members, setMembers] = useState<TripMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [whatsappIssue, setWhatsappIssue] = useState<{
    summary: string;
    detail?: string;
  } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const loadMembers = useCallback(async () => {
    const supabase = getSupabaseClient();
    if (!supabase || !tripId.trim()) {
      setMembers([]);
      setMembersLoading(false);
      return;
    }
    setMembersLoading(true);
    const { data, error } = await supabase
      .from("trip_members")
      .select(memberSelect)
      .eq("trip_id", tripId)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setMembers(data as TripMember[]);
    } else {
      setMembers([]);
    }
    setMembersLoading(false);
  }, [tripId]);

  useEffect(() => {
    void loadMembers();
  }, [loadMembers]);

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

    const member = data && typeof data === "object" && "member" in data ? data.member : null;
    if (member && typeof member === "object") {
      setMembers((prev) => [member as TripMember, ...prev]);
    } else {
      await loadMembers();
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
    }

    setDisplayName("");
    setEmail("");
    setPhone("");
  };

  const labelForRow = (m: TripMember) => m.display_name?.trim() || m.email || m.phone || "Member";

  const subtitleForRow = (m: TripMember) => {
    const primary = labelForRow(m);
    const parts = [m.email, m.phone].filter(Boolean);
    const rest = parts.filter((p) => p !== primary);
    return rest.length > 0 ? rest.join(" · ") : null;
  };

  return (
    <section className="rounded-2xl border border-border/70 bg-background p-4 sm:p-6">
      <h2 className="text-lg font-semibold text-foreground">Trip members</h2>

      <form className="mt-5 grid gap-4 sm:grid-cols-2" onSubmit={onSubmit}>
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

        <p className="text-xs text-muted-foreground sm:col-span-2">
          At least one of display name, email, or phone is required.
        </p>

        {submitError ? (
          <p className="text-sm text-red-500 sm:col-span-2">{submitError}</p>
        ) : null}

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

        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={!tripId.trim() || isSaving}
            className="inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:pointer-events-none disabled:opacity-50"
          >
            {isSaving ? "Adding…" : "Add member"}
          </button>
        </div>
      </form>

      {membersLoading ? (
        <p className="mt-6 text-sm text-muted-foreground">Loading members…</p>
      ) : members.length > 0 ? (
        <ul className="mt-8 divide-y divide-border/60 border-t border-border/60 pt-6">
          {members.map((m) => (
            <li key={m.id} className="py-3 first:pt-0">
              <div className="min-w-0 space-y-0.5">
                <p className="font-medium text-foreground">{labelForRow(m)}</p>
                {subtitleForRow(m) ? (
                  <p className="text-sm text-muted-foreground">{subtitleForRow(m)}</p>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-6 text-sm text-muted-foreground">
          No members yet. Add someone using the form above.
        </p>
      )}
    </section>
  );
}

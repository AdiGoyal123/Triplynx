"use client";

import { FormEvent, useState } from "react";
import { UserMinus } from "lucide-react";
import type { TripMember } from "./types";

type TripParticipantsPanelProps = {
  tripId: string;
  addedByUserId: string | null;
};

const inputClass =
  "h-10 rounded-lg border border-border/80 bg-background px-3 text-sm outline-none ring-offset-background transition placeholder:text-muted-foreground focus:ring-2 focus:ring-primary";

export function TripParticipantsPanel({ tripId, addedByUserId }: TripParticipantsPanelProps) {
  const [members, setMembers] = useState<TripMember[]>([]);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!tripId.trim()) {
      return;
    }
    const dn = displayName.trim() || null;
    const em = email.trim() || null;
    const ph = phone.trim() || null;
    if (!dn && !em && !ph) {
      return;
    }
    const now = new Date().toISOString();
    setMembers((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        trip_id: tripId,
        added_by: addedByUserId,
        display_name: dn,
        email: em,
        phone: ph,
        created_at: now,
        updated_at: null,
      },
    ]);
    setDisplayNorm("");
    setEmail("");
    setPhone("");
  };

  const remove = (id: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== id));
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
      <p className="mt-1 text-sm text-muted-foreground">
        Fields match your <code className="rounded bg-muted px-1 py-0.5 text-xs">trip_members</code>{" "}
        table. Rows are stored in this session only until you wire up the API.
      </p>

      <form className="mt-5 grid gap-4 sm:grid-cols-2" onSubmit={onSubmit}>
        <label className="grid gap-1 sm:col-span-2">
          <span className="text-sm font-medium">Display name</span>
          <input
            className={inputClass}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Alex Kim"
            autoComplete="name"
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
          />
        </label>

        <p className="text-xs text-muted-foreground sm:col-span-2">
          At least one of display name, email, or phone is required. Nullable columns on the server
          still need something to show here.
        </p>

        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={!tripId.trim()}
            className="inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:pointer-events-none disabled:opacity-50"
          >
            Add member
          </button>
        </div>
      </form>

      {members.length > 0 ? (
        <ul className="mt-8 divide-y divide-border/60 border-t border-border/60 pt-6">
          {members.map((m) => (
            <li
              key={m.id}
              className="flex items-start justify-between gap-3 py-3 first:pt-0"
            >
              <div className="min-w-0 space-y-0.5">
                <p className="font-medium text-foreground">{labelForRow(m)}</p>
                {subtitleForRow(m) ? (
                  <p className="text-sm text-muted-foreground">{subtitleForRow(m)}</p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => remove(m.id)}
                className="shrink-0 rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label={`Remove ${labelForRow(m)}`}
              >
                <UserMinus className="h-4 w-4" />
              </button>
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

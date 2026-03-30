"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Users } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { TripMember } from "./types";

type TripParticipantsPanelProps = {
  tripId: string;
  /** Increment to reload the member list (e.g. after adding a member). */
  reloadSignal?: number;
  /** When set, shows an “Add member” control in the header (same pattern as Surveys). */
  onAddMember?: () => void;
};

const memberSelect =
  "id, trip_id, added_by, display_name, email, phone, created_at, updated_at";

export function TripParticipantsPanel({ tripId, reloadSignal = 0, onAddMember }: TripParticipantsPanelProps) {
  const [members, setMembers] = useState<TripMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);

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
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch on mount / tripId / reloadSignal
    void loadMembers();
  }, [loadMembers, reloadSignal]);

  const labelForRow = (m: TripMember) => m.display_name?.trim() || m.email || m.phone || "Member";

  const subtitleForRow = (m: TripMember) => {
    const primary = labelForRow(m);
    const parts = [m.email, m.phone].filter(Boolean);
    const rest = parts.filter((p) => p !== primary);
    return rest.length > 0 ? rest.join(" · ") : null;
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-border/70 bg-background shadow-sm ring-1 ring-black/[0.03] dark:ring-white/[0.06]">
      <div className="border-b border-border/50 bg-gradient-to-b from-muted/40 to-transparent px-4 py-5 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-3.5">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-inner"
              aria-hidden
            >
              <Users className="h-5 w-5" strokeWidth={1.75} />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold tracking-tight text-foreground">Trip members</h2>
              <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted-foreground">
                People on this trip — add emails, phones, or names so everyone stays in the loop.
              </p>
            </div>
          </div>
          {onAddMember ? (
            <button
              type="button"
              onClick={onAddMember}
              className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground shadow-md shadow-primary/20 transition hover:opacity-[0.92] active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" strokeWidth={2.25} aria-hidden />
              Add member
            </button>
          ) : null}
        </div>
      </div>

      <div className="p-4 sm:p-6 sm:pt-5">
        {membersLoading ? (
          <p className="text-sm text-muted-foreground">Loading members…</p>
        ) : members.length > 0 ? (
          <ul className="mt-2 divide-y divide-border/60 border-t border-border/60 pt-5">
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
          <p className="text-sm text-muted-foreground">
            No members yet.{onAddMember ? " Use Add member above to invite someone." : ""}
          </p>
        )}
      </div>
    </section>
  );
}

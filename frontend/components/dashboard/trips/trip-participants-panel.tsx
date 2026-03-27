"use client";

import { useCallback, useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { TripMember } from "./types";

type TripParticipantsPanelProps = {
  tripId: string;
  /** Increment to reload the member list (e.g. after adding via FAB modal). */
  reloadSignal?: number;
};

const memberSelect =
  "id, trip_id, added_by, display_name, email, phone, created_at, updated_at";

export function TripParticipantsPanel({ tripId, reloadSignal = 0 }: TripParticipantsPanelProps) {
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
    <section className="rounded-2xl border border-border/70 bg-background p-4 sm:p-6">
      <h2 className="text-lg font-semibold text-foreground">Trip members</h2>

      {membersLoading ? (
        <p className="mt-6 text-sm text-muted-foreground">Loading members…</p>
      ) : members.length > 0 ? (
        <ul className="mt-6 divide-y divide-border/60 border-t border-border/60 pt-6">
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
          No members yet. Tap the + button to add someone.
        </p>
      )}
    </section>
  );
}

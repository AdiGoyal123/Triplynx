"use client";

import { useCallback, useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { TripRow } from "./types";

export function useMyTrips() {
  const [trips, setTrips] = useState<TripRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      setError(
        "Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY.",
      );
      setTrips([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) {
      setError(userError.message);
      setTrips([]);
      setLoading(false);
      return;
    }

    if (!userData.user?.id) {
      setError("Sign in to see your trips.");
      setTrips([]);
      setLoading(false);
      return;
    }

    const { data, error: listError } = await supabase
      .from("trips")
      .select("id, title, description, start_date, end_date, status, created_at")
      .eq("created_by", userData.user.id)
      .order("created_at", { ascending: false });

    if (listError) {
      setError(listError.message);
      setTrips([]);
    } else {
      setTrips((data as TripRow[]) ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { trips, loading, error, refresh };
}

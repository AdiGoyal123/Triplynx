"use client";

import { useCallback, useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { Survey, SurveyOption, SurveyStatus } from "./types";

function normalizeMetadata(raw: unknown): Record<string, unknown> {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    return raw as Record<string, unknown>;
  }
  return {};
}

function mapOptionRow(row: {
  id: string;
  created_at: string;
  survey_id: string;
  label: string | null;
  value: string | null;
  metadata: unknown;
  updated_at: string | null;
}): SurveyOption {
  return {
    id: row.id,
    created_at: row.created_at,
    survey_id: row.survey_id,
    label: row.label,
    value: row.value,
    metadata: normalizeMetadata(row.metadata),
    updated_at: row.updated_at,
  };
}

export function useTripSurveys(tripId: string) {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const tid = tripId.trim();
    if (!tid) {
      setSurveys([]);
      setError(null);
      setLoading(false);
      return;
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      setError(
        "Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY.",
      );
      setSurveys([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) {
      setError(userError.message);
      setSurveys([]);
      setLoading(false);
      return;
    }
    if (!userData.user?.id) {
      setError("Sign in to see surveys for this trip.");
      setSurveys([]);
      setLoading(false);
      return;
    }

    const { data: rows, error: listError } = await supabase
      .from("surveys")
      .select(
        "id, created_at, trip_id, created_by, title, description, opens_at, closes_at, updated_at, status",
      )
      .eq("trip_id", tid)
      .order("created_at", { ascending: false });

    if (listError) {
      setError(listError.message);
      setSurveys([]);
      setLoading(false);
      return;
    }

    const surveyRows = rows ?? [];
    const ids = surveyRows.map((r) => r.id);

    let optionRows: Array<{
      id: string;
      created_at: string;
      survey_id: string;
      label: string | null;
      value: string | null;
      metadata: unknown;
      updated_at: string | null;
    }> = [];

    if (ids.length > 0) {
      const { data: optData, error: optError } = await supabase
        .from("survey_options")
        .select("id, created_at, survey_id, label, value, metadata, updated_at")
        .in("survey_id", ids);

      if (optError) {
        setError(optError.message);
        setSurveys([]);
        setLoading(false);
        return;
      }
      optionRows = optData ?? [];
    }

    const bySurvey = new Map<string, SurveyOption[]>();
    for (const o of optionRows) {
      const list = bySurvey.get(o.survey_id) ?? [];
      list.push(mapOptionRow(o));
      bySurvey.set(o.survey_id, list);
    }

    const next: Survey[] = surveyRows.map((r) => {
      const st = r.status;
      const status: SurveyStatus | null =
        st === "draft" || st === "ongoing" || st === "closed" ? st : null;
      return {
        id: r.id,
        created_at: r.created_at,
        updated_at: r.updated_at,
        trip_id: r.trip_id,
        created_by: r.created_by,
        title: r.title,
        description: r.description,
        opens_at: r.opens_at,
        closes_at: r.closes_at,
        status,
        options: bySurvey.get(r.id) ?? [],
      };
    });

    setSurveys(next);
    setLoading(false);
  }, [tripId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch on mount / tripId change
    void refresh();
  }, [refresh]);

  return { surveys, loading, error, refresh };
}

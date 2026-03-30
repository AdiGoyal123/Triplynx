export type TripRow = {
  id: string;
  title: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  status: string;
  created_at: string;
};

export type TripForm = {
  title: string;
  startDate: string;
  endDate: string;
  description: string;
};

export const initialTripForm: TripForm = {
  title: "",
  startDate: "",
  endDate: "",
  description: "",
};

/** Matches `public.survey_status`. */
export type SurveyStatus = "draft" | "scheduled" | "ongoing" | "closed";

/**
 * Matches `public.survey_options` (client-side).
 * For a single “option” line in the UI, we store the same text in both `label` and `value`
 * so the DB shape stays valid without asking users for two fields.
 */
export type SurveyOption = {
  id: string;
  created_at: string;
  survey_id: string;
  label: string | null;
  value: string | null;
  metadata: Record<string, unknown>;
  updated_at: string | null;
};

/**
 * Matches `public.surveys` (client-side / local draft until API exists).
 * `created_by` uses a placeholder UUID until persistence wires auth.
 * `options` mirrors `survey_options` rows for this survey.
 */
export type Survey = {
  id: string;
  created_at: string;
  trip_id: string;
  created_by: string;
  title: string;
  description: string | null;
  opens_at: string | null;
  closes_at: string | null;
  updated_at: string;
  status: SurveyStatus | null;
  options: SurveyOption[];
};

/** One editable “option” row in the create-survey form (what voters will choose). */
export type SurveyOptionDraft = {
  clientKey: string;
  text: string;
};

export function newSurveyOptionDraft(): SurveyOptionDraft {
  return { clientKey: crypto.randomUUID(), text: "" };
}

export type SurveyFormFields = {
  title: string;
  description: string;
  opensAt: string;
  closesAt: string;
  optionRows: SurveyOptionDraft[];
};

export const initialSurveyForm: SurveyFormFields = {
  title: "",
  description: "",
  opensAt: "",
  closesAt: "",
  optionRows: [],
};

/** Matches `public.trip_members` columns (client-side / pre-insert). */
export type TripMember = {
  id: string;
  trip_id: string;
  added_by: string | null;
  display_name: string | null;
  email: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string | null;
};

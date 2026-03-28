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
export type SurveyStatus = "draft" | "ongoing" | "closed";

/**
 * Matches `public.surveys` (client-side / local draft until API exists).
 * `created_by` uses a placeholder UUID until persistence wires auth.
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
};

export type SurveyFormFields = {
  title: string;
  description: string;
  opensAt: string;
  closesAt: string;
  status: SurveyStatus | "";
};

export const initialSurveyForm: SurveyFormFields = {
  title: "",
  description: "",
  opensAt: "",
  closesAt: "",
  status: "draft",
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

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

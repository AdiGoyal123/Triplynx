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

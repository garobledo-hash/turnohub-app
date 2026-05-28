export type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "scheduled"
  | "completed"
  | "cancelled"
  | "no_show";

export interface Profile {
  id: string;
  full_name: string;
  business_name: string;
  slug: string;
  phone: string | null;
  whatsapp: string | null;
  logo_url: string | null;
  brand_color: string | null;
  email: string | null;
  trial_active: boolean;
  trial_end_at: string;
  plan_active: boolean;
  plan_end_at: string | null;
  created_at: string;
  booking_slug: string | null;
}

export interface Service {
  id: string;
  business_id: string;
  name: string;
  duration_minutes: number;
  price: number;
  active: boolean;
  created_at: string;
}

export interface BusinessHour {
  id: string;
  business_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
  is_closed: boolean;
  created_at: string;
  start_time_2: string | null;
  end_time_2: string | null;
  updated_at: string;
  sort_order: number | null;
}

export interface Appointment {
  id: string;
  business_id: string;
  service_id: string | null;
  client_name: string;
  client_phone: string | null;
  client_email: string | null;
  starts_at: string;
  end_at: string;
  status: AppointmentStatus;
  notes: string | null;
  created_at: string;
}

export interface Payment {
  id: string;
  user_id: string;
  plan: string | null;
  amount: number | null;
  status: string | null;
  mp_payment_id: string | null;
  mp_preference_id: string | null;
  raw: Record<string, unknown> | null;
  created_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  status: string;
  current_period_end: string | null;
  mp_preapproval_id: string | null;
  created_at: string;
}

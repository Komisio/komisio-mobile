import type { User } from "@supabase/supabase-js";

// Navigation hints only. Auth and database policies independently authorize
// every read/write; a phone identity never becomes a seller account here.
export function hasVerifiedEmail(user: User | undefined) {
  return Boolean(user?.email && user.email_confirmed_at);
}
export function hasVerifiedPhone(user: User | undefined) {
  return Boolean(user?.phone && user.phone_confirmed_at);
}

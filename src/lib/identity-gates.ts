import type { User } from "@supabase/supabase-js";

// Navigation hints only. Server policies independently check identity and MFA.
// Contact details never grant access to a seller account.
export function hasVerifiedEmail(user: User | undefined) {
  return Boolean(user?.email && user.email_confirmed_at && !user.is_anonymous);
}

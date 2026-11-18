import type { User } from "@supabase/supabase-js";

// Navigation hints only. Server policies independently check identity and MFA.
// Contact details never grant access to a seller account.
export function hasVerifiedEmail(user: User | undefined) {
  return Boolean(user?.email && user.email_confirmed_at && !user.is_anonymous);
}

// Central ownership is the Auth ID, never an email match to a store seller.
// Supabase can retain an empty primary email on an earlier phone account even
// after linking a verified Apple identity. Only provider-owned identity claims
// qualify; editable user/contact metadata is not verification evidence.
export function centralIdentityEmail(user: User | undefined): string | null {
  if (!user || user.is_anonymous) return null;
  if (hasVerifiedEmail(user)) return user.email!;
  for (const provider of ["apple", "google"]) {
    const email = user.identities?.find(
      (identity) =>
        identity.user_id === user.id &&
        identity.provider === provider &&
        identity.identity_data?.email_verified === true &&
        typeof identity.identity_data.email === "string" &&
        identity.identity_data.email.trim().length > 0,
    )?.identity_data?.email;
    if (typeof email === "string") return email;
  }
  return null;
}

export function hasCentralIdentity(user: User | undefined) {
  return centralIdentityEmail(user) !== null;
}

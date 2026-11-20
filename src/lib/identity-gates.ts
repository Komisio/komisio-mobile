import type { User } from "@supabase/supabase-js";

export type SignInMethod =
  string | { method: string; timestamp?: number; provider?: string };

// Presentation only. The first linked identity is not necessarily the sign-in method.
export function profileSessionMethod(
  user: User,
  methods: readonly SignInMethod[] = [],
) {
  const identities = (user.identities ?? []).filter(
    (i) => i.user_id === user.id,
  );
  const social = identities.filter(
    (i) => i.provider === "apple" || i.provider === "google",
  );
  const brand = (provider: string) =>
    provider === "apple" ? "Apple" : "Google";
  for (const entry of methods) {
    const method = typeof entry === "string" ? entry : entry.method;
    if (["password", "otp", "magiclink", "email/signup"].includes(method))
      return hasVerifiedEmail(user) ? "email" : null;
    if (method !== "oauth" && method !== "id_token") continue;
    if (social.length === 1) return brand(social[0].provider);
    if (typeof entry !== "string") {
      const explicit = social.find((i) => i.provider === entry.provider);
      if (explicit) return brand(explicit.provider);
      const at = entry.timestamp;
      const matched = social.filter(
        (i) =>
          i.last_sign_in_at &&
          Math.floor(Date.parse(i.last_sign_in_at) / 1000) === at,
      );
      if (matched.length === 1) return brand(matched[0].provider);
    }
    return null;
  }
  if (social.length === 1 && identities.length === 1)
    return brand(social[0].provider);
  if (!social.length && hasVerifiedEmail(user)) return "email";
  return null;
}

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

import assert from "node:assert/strict";
import test from "node:test";
import type { User } from "@supabase/supabase-js";
import {
  centralIdentityEmail,
  hasVerifiedEmail,
} from "../src/lib/identity-gates.ts";

const user = (values: Partial<User>) => ({ id: "owner", ...values }) as User;
const linked = (
  provider = "apple",
  verified: unknown = true,
  owner = "owner",
) =>
  [
    {
      id: "identity",
      identity_id: "identity",
      provider,
      user_id: owner,
      identity_data: { email: "relay@example.test", email_verified: verified },
    },
  ] as User["identities"];

test("linked Apple/Google email recognizes the same central account without enabling store email access", () => {
  for (const provider of ["apple", "google"]) {
    const u = user({
      email: "",
      email_confirmed_at: "2026-11-18",
      identities: linked(provider),
    });
    assert.equal(centralIdentityEmail(u), "relay@example.test");
    assert.equal(hasVerifiedEmail(u), false);
  }
});
test("contact metadata, unverified identities and unrelated owners never authenticate central intake", () => {
  for (const u of [
    undefined,
    user({ phone: "+46700000000", phone_confirmed_at: "2026-11-18" }),
    user({
      user_metadata: { email: "fake@example.test", email_verified: true },
    }),
    user({ identities: linked("apple", false) }),
    user({ identities: linked("apple", "true") }),
    user({ identities: linked("email") }),
    user({ identities: linked("apple", true, "someone-else") }),
    user({ identities: linked(), is_anonymous: true }),
  ])
    assert.equal(centralIdentityEmail(u), null);
});
test("verified primary email wins, and an empty primary field never renders as an identity", () => {
  assert.equal(
    centralIdentityEmail(
      user({
        email: "first@example.test",
        email_confirmed_at: "2026-11-18",
        identities: linked(),
      }),
    ),
    "first@example.test",
  );
  assert.equal(
    centralIdentityEmail(user({ email: "", email_confirmed_at: "2026-11-18" })),
    null,
  );
});

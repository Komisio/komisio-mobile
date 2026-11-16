import * as AppleAuthentication from "expo-apple-authentication";

// React to a native revocation event. Do not poll on every email/phone login:
// a historically linked Apple identity may already be revoked, and must not
// prevent the user from signing in through another valid method.
export function watchAppleRevocation(user: string, onRevoked: () => void) {
  let active = true;
  let notified = false;
  async function check() {
    try {
      const state = await AppleAuthentication.getCredentialStateAsync(user);
      if (
        active &&
        !notified &&
        (state ===
          AppleAuthentication.AppleAuthenticationCredentialState.REVOKED ||
          state ===
            AppleAuthentication.AppleAuthenticationCredentialState.NOT_FOUND)
      ) {
        notified = true;
        onRevoked();
      }
    } catch {
      // A simulator or unavailable native service is not proof of revocation.
    }
  }
  const native = AppleAuthentication.addRevokeListener(() => void check());
  return () => {
    active = false;
    native.remove();
  };
}

export async function appleCredential(nonce: string, state: string) {
  if (!(await AppleAuthentication.isAvailableAsync()))
    throw new Error("AUTH_UNAVAILABLE");
  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [AppleAuthentication.AppleAuthenticationScope.EMAIL],
    nonce,
    state,
  });
  if (!credential.identityToken) throw new Error("AUTH_FAILED");
  return { token: credential.identityToken, state: credential.state };
}

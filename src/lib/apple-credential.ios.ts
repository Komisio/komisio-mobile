import * as AppleAuthentication from "expo-apple-authentication";

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

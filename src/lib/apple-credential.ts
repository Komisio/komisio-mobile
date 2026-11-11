export async function appleCredential(
  _nonce: string,
  _state: string,
): Promise<{ token: string; state: string | null }> {
  throw new Error("AUTH_UNAVAILABLE");
}

import type { CommandTransport } from "./mobile-command-http.ts";
import { isId } from "./catalogue.ts";
import {
  parseExternalOffer,
  parseExternalOfferDetail,
} from "./external-offer.ts";

export function createExternalPhoneRead(deps: CommandTransport) {
  return async function call(body: unknown) {
    if (!deps.endpoint) throw new Error("OFFER_UNAVAILABLE");
    const session = await deps.session();
    if (!session || session.user !== deps.user)
      throw new Error("SESSION_CHANGED");
    const controller = new AbortController(),
      timeout = setTimeout(() => controller.abort(), 30000);
    try {
      const r = await deps.request(deps.endpoint, {
        method: "POST",
        redirect: "error",
        credentials: "omit",
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${session.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      const raw = await r.text();
      if (raw.length > 131072) throw new Error("OFFER_UNAVAILABLE");
      const value = JSON.parse(raw);
      if (r.status !== 200)
        throw new Error(
          [
            "AUTH_REQUIRED",
            "MFA_REQUIRED",
            "PASSWORD_UPDATE_REQUIRED",
          ].includes(value?.error)
            ? value.error
            : "OFFER_UNAVAILABLE",
        );
      if ((await deps.session())?.user !== deps.user)
        throw new Error("SESSION_CHANGED");
      return value;
    } finally {
      clearTimeout(timeout);
    }
  };
}

export function createExternalOfferApi(deps: CommandTransport) {
  const call = createExternalPhoneRead(deps);
  return {
    async list(requestIds: string[]) {
      if (
        requestIds.length > 25 ||
        !requestIds.every(isId) ||
        new Set(requestIds).size !== requestIds.length
      )
        throw new Error("OFFER_UNAVAILABLE");
      const p = await call({ action: "list", requestIds });
      if (!p || !Array.isArray(p.offers) || p.offers.length > 25)
        throw new Error("OFFER_UNAVAILABLE");
      const offers = p.offers.map(parseExternalOffer);
      if (
        offers.some(
          (o: ReturnType<typeof parseExternalOffer>) =>
            !requestIds.includes(o.requestId),
        ) ||
        new Set(
          offers.map((o: ReturnType<typeof parseExternalOffer>) => o.requestId),
        ).size !== offers.length
      )
        throw new Error("OFFER_UNAVAILABLE");
      return offers as ReturnType<typeof parseExternalOffer>[];
    },
    async read(id: string) {
      if (!isId(id)) throw new Error("OFFER_UNAVAILABLE");
      const offer = parseExternalOfferDetail(
        await call({ action: "read", offerId: id }),
      );
      if (offer.id !== id) throw new Error("OFFER_UNAVAILABLE");
      return offer;
    },
  };
}

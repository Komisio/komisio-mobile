import type { ExternalRequest } from "./external-submission.ts";
import { offerAmount, type ExternalOffer } from "./external-offer.ts";
import { externalOfferCopy } from "./external-offer-copy.ts";
import { externalHandoverCopy } from "./external-handover-copy.ts";
import { externalSubmissionCopy } from "./external-submission-copy.ts";
import { externalLifecycleCopy } from "./external-lifecycle-copy.ts";
import { photoFlowCopy } from "./photo-flow-copy.ts";
import { formattingLocale, type Locale } from "./locale.ts";

export function externalItemPresentation(
  item: ExternalRequest,
  offer: ExternalOffer | undefined,
  locale: Locale,
) {
  const o = externalOfferCopy(locale),
    h = externalHandoverCopy(locale),
    t = externalSubmissionCopy(locale),
    lifecycle = externalLifecycleCopy(locale);
  const terminal = item.lifecycleStatus;
  const knownStatus =
    terminal === "open"
      ? h.open
      : terminal === "received" || terminal === "registered"
        ? h.received
        : terminal === "cancelled"
          ? h.cancelled
          : terminal === "accepted"
            ? o.accepted
            : terminal === "offered" && !offer
              ? o.title
              : undefined;
  const status =
    knownStatus ??
    (terminal === "expired"
      ? o.expired
      : terminal === "rejected"
        ? t.declined
        : terminal === "declined"
          ? o.declined
          : terminal &&
              ["withdrawn", "sold", "acquired", "ended"].includes(terminal)
            ? lifecycle[terminal as "withdrawn" | "sold" | "acquired" | "ended"]
            : offer?.handover
              ? h[offer.handover.status]
              : offer
                ? offer.status === "offered"
                  ? o.offerBadge.replace(
                      "{amount}",
                      offerAmount(
                        offer.sellerAmountOre,
                        formattingLocale(locale),
                      ),
                    )
                  : offer.status === "accepted"
                    ? o.accepted
                    : offer.status === "declined"
                      ? o.declined
                      : o.expired
                : item.status === "waiting"
                  ? t.waiting
                  : t.declined);
  const tone: "neutral" | "positive" | "warning" =
    offer?.handover?.status === "open"
      ? "warning"
      : offer?.handover?.status === "received" || offer?.status === "offered"
        ? "positive"
        : item.status === "waiting"
          ? "neutral"
          : "warning";
  const dates = new Intl.DateTimeFormat(formattingLocale(locale), {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const date = offer?.handover?.receivedAt
    ? h.receivedAt.replace(
        "{date}",
        dates.format(new Date(offer.handover.receivedAt)),
      )
    : photoFlowCopy(locale).submitted.replace(
        "{date}",
        dates.format(new Date(item.created_at)),
      );
  return { status, tone, date };
}

export function externalItemAmounts(
  item: ExternalRequest,
  offer?: ExternalOffer,
) {
  type Amount = {
    label:
      "requestedAmount" | "requestedResale" | "agreedAmount" | "offeredAmount";
    ore: string;
    currency: string;
  };
  const amounts: Amount[] = [];
  if (offer)
    amounts.push({
      label: offer.status === "accepted" ? "agreedAmount" : "offeredAmount",
      ore: offer.sellerAmountOre,
      currency: offer.currency,
    });
  if (
    item.desired_price_ore !== null &&
    (!offer ||
      item.price_basis !== "seller_amount" ||
      item.desired_price_ore !== offer.sellerAmountOre)
  ) {
    amounts.push({
      label:
        item.price_basis === "seller_amount"
          ? "requestedAmount"
          : "requestedResale",
      ore: item.desired_price_ore,
      currency: item.currency,
    });
  }
  return amounts;
}

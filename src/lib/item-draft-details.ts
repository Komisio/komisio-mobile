export const itemConditions = [
  "like_new",
  "very_good",
  "good",
  "worn",
] as const;
export type ItemCondition = (typeof itemConditions)[number];
export type ItemDraftDetails = {
  description: string;
  brand: string;
  condition: ItemCondition | null;
  notes: string;
  desiredPrice: string;
};
export const emptyItemDetails = (): ItemDraftDetails => ({
  description: "",
  brand: "",
  condition: null,
  notes: "",
  desiredPrice: "",
});

/** Partial text is durable too; completion is validated separately before review. */
export function parseItemDraftDetails(value: unknown): ItemDraftDetails {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("DRAFT_UNAVAILABLE");
  const v = value as Record<string, unknown>;
  const limits = {
    description: 160,
    brand: 100,
    notes: 1000,
    desiredPrice: 32,
  };
  for (const [field, max] of Object.entries(limits))
    if (
      typeof v[field] !== "string" ||
      v[field].length > max ||
      /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(v[field])
    )
      throw new Error("DRAFT_UNAVAILABLE");
  if (
    v.condition !== null &&
    !itemConditions.includes(v.condition as ItemCondition)
  )
    throw new Error("DRAFT_UNAVAILABLE");
  return {
    description: v.description as string,
    brand: v.brand as string,
    notes: v.notes as string,
    desiredPrice: v.desiredPrice as string,
    condition: v.condition as ItemCondition | null,
  };
}
/** A seller's optional price wish; no price, payout or guarantee is set here. */
export function requestedPriceOre(input: string): string | null {
  const value = input.trim();
  if (!value) return null;
  if (!/^\d{1,9}(?:[.,]\d{1,2})?$/.test(value))
    throw new Error("INVALID_REQUESTED_PRICE");
  const [whole, fraction = ""] = value.replace(",", ".").split(".");
  const ore = BigInt(whole) * 100n + BigInt(fraction.padEnd(2, "0"));
  if (ore <= 0n || ore > 99999999999n)
    throw new Error("INVALID_REQUESTED_PRICE");
  return ore.toString();
}
export function itemDetailsErrors(
  details: ItemDraftDetails,
): ("description" | "condition" | "desiredPrice")[] {
  const errors: ("description" | "condition" | "desiredPrice")[] = [];
  if (!details.description.trim()) errors.push("description");
  if (!details.condition) errors.push("condition");
  try {
    requestedPriceOre(details.desiredPrice);
  } catch {
    errors.push("desiredPrice");
  }
  return errors;
}

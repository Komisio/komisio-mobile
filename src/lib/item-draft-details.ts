export const itemConditions = [
  "like_new",
  "very_good",
  "good",
  "worn",
] as const;
export type ItemCondition = (typeof itemConditions)[number];
export const saleMethods = ["direct_purchase", "consignment"] as const;
export type SaleMethod = (typeof saleMethods)[number];
export const isSaleMethod = (value: unknown): value is SaleMethod =>
  value === "direct_purchase" || value === "consignment";
export type ItemDraftDetails = {
  saleMethod?: SaleMethod;
  description: string;
  brand: string;
  condition: ItemCondition | null;
  notes: string;
  desiredSellerAmount: string;
};
export const emptyItemDetails = (): ItemDraftDetails => ({
  description: "",
  brand: "",
  condition: null,
  notes: "",
  desiredSellerAmount: "",
});

/** Partial text is durable too; completion is validated separately before review. */
export function parseItemDraftDetails(value: unknown): ItemDraftDetails {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("DRAFT_UNAVAILABLE");
  const old = value as Record<string, unknown>;
  // Preserve old photos/details, but never reinterpret a resale wish as pay.
  const v = {
    ...old,
    desiredSellerAmount:
      old.desiredSellerAmount === undefined &&
      typeof old.desiredPrice === "string"
        ? ""
        : old.desiredSellerAmount,
  } as Record<string, unknown>;
  const limits = {
    description: 160,
    brand: 100,
    notes: 1000,
    desiredSellerAmount: 32,
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
  if (v.saleMethod !== undefined && !isSaleMethod(v.saleMethod))
    throw new Error("DRAFT_UNAVAILABLE");
  return {
    ...(v.saleMethod ? { saleMethod: v.saleMethod } : {}),
    description: v.description as string,
    brand: v.brand as string,
    notes: v.notes as string,
    desiredSellerAmount: v.desiredSellerAmount as string,
    condition: v.condition as ItemCondition | null,
  };
}
/** Parse the entered amount exactly; partial drafts can still be saved. */
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
): ("description" | "condition" | "desiredSellerAmount")[] {
  const errors: ReturnType<typeof itemDetailsErrors> = [];
  if (!details.description.trim()) errors.push("description");
  if (!details.condition) errors.push("condition");
  try {
    const amount = requestedPriceOre(details.desiredSellerAmount);
    if (amount === null || BigInt(amount) < 30_000n)
      errors.push("desiredSellerAmount");
  } catch {
    errors.push("desiredSellerAmount");
  }
  return errors;
}

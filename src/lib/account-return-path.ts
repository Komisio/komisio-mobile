// Only local, known destinations may be resumed after authentication.
export function accountReturnPath(value: unknown) {
  if (value === "photo-details") return "/photo-details" as const;
  if (value === "photo-review") return "/photo-review" as const;
  if (value === "external-items") return "/external-items" as const;
  return "/home" as const;
}

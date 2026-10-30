import { supabase } from "./supabase";
import { parseOverview } from "./seller-overview";
import { readFailure } from "./catalogue";

export async function readSellerOverview(
  tenant: string,
  seller: string,
  signal: AbortSignal,
) {
  const [sales, items] = await Promise.all([
    supabase
      .rpc("my_recent_sales", { p_tenant: tenant, p_seller: seller })
      .abortSignal(signal),
    supabase
      .rpc("my_items_page", {
        p_tenant: tenant,
        p_seller: seller,
        p_status: "expiring",
        p_query: "",
        p_offset: 0,
      })
      .abortSignal(signal),
  ]);
  if (items.error) throw items.error;
  // Missing during staged rollout or temporarily offline is not "no sales".
  // An identity/access refusal still clears the whole account-scoped view.
  if (sales.error && readFailure(sales.error) === "denied") throw sales.error;
  return parseOverview(items.data, sales.error ? null : sales.data, seller);
}

import { supabase } from "./supabase";
import { parseOverview } from "./seller-overview";

export async function readSellerOverview(
  tenant: string,
  seller: string,
  signal: AbortSignal,
) {
  const [economy, items] = await Promise.all([
    supabase
      .rpc("my_seller_economy", { p_tenant: tenant, p_seller: seller })
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
  if (economy.error) throw economy.error;
  if (items.error) throw items.error;
  return parseOverview(economy.data, items.data, seller);
}

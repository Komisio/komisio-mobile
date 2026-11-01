import { supabase } from "./supabase";
import {
  parseSellerItemDetail,
  parseSellerItemsPage,
  type ItemFilter,
} from "./seller-items";

export async function readSellerItems(
  tenant: string,
  seller: string,
  query: string,
  offset: number,
  status: ItemFilter,
  signal: AbortSignal,
) {
  const { data, error } = await supabase
    .rpc("my_items_page", {
      p_tenant: tenant,
      p_seller: seller,
      p_query: query,
      p_offset: offset,
      p_status: status,
    })
    .abortSignal(signal);
  if (error) throw error;
  return parseSellerItemsPage(data);
}
export async function readSellerItem(
  tenant: string,
  seller: string,
  item: string,
  signal: AbortSignal,
) {
  const { data, error } = await supabase
    .rpc("my_item_detail", {
      p_tenant: tenant,
      p_seller: seller,
      p_item: item,
    })
    .abortSignal(signal);
  if (error) throw error;
  return parseSellerItemDetail(data, item);
}

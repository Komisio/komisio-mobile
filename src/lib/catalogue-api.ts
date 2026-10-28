import { supabase } from "./supabase";
import { parseDetail, parsePage } from "./catalogue";

export async function readCatalogue(
  tenant: string,
  query: string,
  offset: number,
  signal: AbortSignal,
) {
  const { data, error } = await supabase
    .rpc("store_catalogue", {
      p_tenant: tenant,
      p_query: query,
      p_offset: offset,
    })
    .abortSignal(signal);
  if (error) throw error;
  return parsePage(data, tenant);
}

export async function readCatalogueItem(
  tenant: string,
  item: string,
  signal: AbortSignal,
) {
  const { data, error } = await supabase
    .rpc("store_catalogue_item", { p_tenant: tenant, p_item: item })
    .abortSignal(signal);
  if (error) throw error;
  return parseDetail(data, tenant, item);
}

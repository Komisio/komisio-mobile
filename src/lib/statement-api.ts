import { supabase } from "./supabase";
import { parseStatementDetail, parseStatementPage } from "./seller-statements";

export async function readStatements(
  tenant: string,
  seller: string,
  offset: number,
  signal: AbortSignal,
) {
  const { data, error } = await supabase
    .rpc("my_seller_statements_page", {
      p_tenant: tenant,
      p_seller: seller,
      p_offset: offset,
    })
    .abortSignal(signal);
  if (error) throw error;
  return parseStatementPage(data, tenant, seller, offset);
}
export async function readStatement(
  tenant: string,
  seller: string,
  id: string,
  signal: AbortSignal,
) {
  const [document, context] = await Promise.all([
    supabase
      .rpc("my_seller_statement", {
        p_tenant: tenant,
        p_seller: seller,
        p_statement: id,
      })
      .abortSignal(signal),
    readStatements(tenant, seller, 0, signal),
  ]);
  if (document.error) throw document.error;
  return parseStatementDetail(document.data, id, context.currency);
}

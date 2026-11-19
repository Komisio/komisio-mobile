import { useCallback, useState } from "react";
import { Text } from "react-native";
import { useFocusEffect } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useI18n } from "@/lib/i18n";
import { storeSellerCopy } from "@/lib/store-seller-copy";
import { uiStyles } from "./ui";

export function StoreSubmissionNotice({
  tenant,
  seller,
}: {
  tenant: string;
  seller: string;
}) {
  const { locale } = useI18n();
  const [disabled, setDisabled] = useState(false);
  useFocusEffect(
    useCallback(() => {
      const controller = new AbortController();
      setDisabled(false);
      void (async () => {
        try {
          const { data, error } = await supabase
            .rpc("my_submission_settings", {
              p_tenant: tenant,
              p_seller: seller,
            })
            .abortSignal(controller.signal);
          if (!controller.signal.aborted && !error)
            setDisabled(data?.enabled === false);
        } catch {
          // The guidance is shown only for a confirmed store policy.
        }
      })();
      return () => controller.abort();
    }, [tenant, seller]),
  );
  return disabled ? (
    <Text style={uiStyles.note}>{storeSellerCopy[locale].photosOff}</Text>
  ) : null;
}

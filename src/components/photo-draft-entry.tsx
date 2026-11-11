import { router } from "expo-router";
import { Button } from "./ui";
import { useI18n } from "@/lib/i18n";
import { photoDraftCopy } from "@/lib/photo-draft-copy";
import { photoFlowCopy } from "@/lib/photo-flow-copy";
import { useSession } from "@/lib/session";

export function PhotoDraftEntry() {
  const { locale } = useI18n();
  const { session } = useSession();
  return (
    <>
      <Button
        label={photoDraftCopy(locale).title}
        variant="secondary"
        onPress={() => router.push("/photo-draft")}
      />
      <Button
        label={photoFlowCopy(locale).myItems}
        variant="text"
        onPress={() =>
          router.push(
            session
              ? "/external-items"
              : {
                  pathname: "/photo-phone",
                  params: { destination: "requests" },
                },
          )
        }
      />
    </>
  );
}

import { useCallback, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";
import { openBrowserAsync } from "expo-web-browser";
import { useI18n } from "@/lib/i18n";
import { Button, Message } from "./ui";

export function ExternalPageButton({
  label,
  url,
  variant = "text",
}: {
  label: string;
  url: string;
  variant?: "text" | "secondary";
}) {
  const { d } = useI18n();
  const [failed, setFailed] = useState(false);
  const attempt = useRef(0);
  useFocusEffect(
    useCallback(() => {
      setFailed(false);
      return () => {
        attempt.current++;
      };
    }, []),
  );

  const open = async () => {
    const current = ++attempt.current;
    setFailed(false);
    // On iOS this promise lasts until dismissal. Never disable re-taps:
    // a new native call is also how Expo recovers a dropped presentation.
    // The native module prevents simultaneous presentations with `locked`.
    try {
      const result = await openBrowserAsync(url);
      if (current === attempt.current) setFailed(result.type === "locked");
    } catch {
      if (current === attempt.current) setFailed(true);
    }
  };
  return (
    <>
      <Button label={label} variant={variant} onPress={() => void open()} />
      {failed ? <Message tone="error">{d.externalPage.failed}</Message> : null}
    </>
  );
}

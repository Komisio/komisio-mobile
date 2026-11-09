import { useState } from "react";
import { Image } from "expo-image";
import { View } from "react-native";
import { Button, Message, colors } from "./ui";

export function PhotoDraftImage({
  uri,
  label,
  errorText,
  retryLabel,
}: {
  uri: string;
  label: string;
  errorText: string;
  retryLabel: string;
}) {
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  return (
    <View style={{ gap: 4 }}>
      <Image
        key={attempt}
        source={{ uri }}
        contentFit="contain"
        cachePolicy="none"
        accessibilityLabel={label}
        style={{
          width: "100%",
          aspectRatio: 1,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: colors.line,
          backgroundColor: "white",
        }}
        onError={() => setFailed(true)}
      />
      {failed ? (
        <>
          <Message tone="error">{errorText}</Message>
          <Button
            label={retryLabel}
            variant="text"
            onPress={() => {
              setFailed(false);
              setAttempt((n) => n + 1);
            }}
          />
        </>
      ) : null}
    </View>
  );
}

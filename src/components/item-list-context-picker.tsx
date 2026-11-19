import { View } from "react-native";
import { router } from "expo-router";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { hasVerifiedEmail } from "@/lib/identity-gates";
import { Button, Choice, uiStyles } from "./ui";

export function ItemListContextPicker() {
  const { d } = useI18n();
  const { store, lastStore, session, chooseStore } = useSession();
  if (!hasVerifiedEmail(session?.user)) return null;
  const previous = store ?? lastStore;
  const select = (next: typeof store) => {
    chooseStore(next);
    router.setParams({
      source: undefined,
      sent: undefined,
      request: undefined,
      filter: undefined,
    });
  };
  return (
    <View style={{ gap: 4 }}>
      <View style={uiStyles.choices}>
        <Choice
          label="Komisio"
          selected={!store}
          onPress={() => select(null)}
        />
        {previous ? (
          <Choice
            label={previous.name}
            selected={store?.id === previous.id}
            onPress={() => select(previous)}
          />
        ) : null}
      </View>
      <Button
        label={d.login.changeStore}
        variant="text"
        onPress={() =>
          router.push({
            pathname: "/home/stores",
            params: { returnTo: "items" },
          })
        }
      />
    </View>
  );
}

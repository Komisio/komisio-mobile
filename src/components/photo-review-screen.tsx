import { Text, View } from "react-native";
import { router } from "expo-router";
import { Button, Card, Loading, Message, Screen, uiStyles } from "./ui";
import { PhotoDraftImage } from "./photo-draft-image";
import { useItemDraft } from "@/lib/use-item-draft";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { itemDraftCopy } from "@/lib/item-draft-copy";
import { photoDraftCopy } from "@/lib/photo-draft-copy";
import { itemDetailsErrors } from "@/lib/item-draft-details";

export function PhotoReviewScreen() {
  const { locale, d } = useI18n();
  const t = itemDraftCopy(locale);
  const photo = photoDraftCopy(locale);
  const { snapshot, failed, reload } = useItemDraft();
  const { session, store } = useSession();
  if (failed)
    return (
      <Screen topSafeArea={false}>
        <Message tone="error">{photo.error}</Message>
        <Button label={d.retry} onPress={reload} />
      </Screen>
    );
  if (!snapshot)
    return (
      <Screen topSafeArea={false}>
        <Loading />
      </Screen>
    );
  const { draft, photos } = snapshot;
  const { details } = draft;
  if (!photos.length)
    return (
      <Screen topSafeArea={false}>
        <Message>{t.noPhotos}</Message>
        <Button
          label={photo.title}
          onPress={() => router.navigate("/photo-draft")}
        />
      </Screen>
    );
  if (!draft.store || itemDetailsErrors(details).length)
    return (
      <Screen topSafeArea={false}>
        <Button
          label={t.editDetails}
          onPress={() => router.navigate("/photo-details")}
        />
      </Screen>
    );
  return (
    <Screen topSafeArea={false}>
      <Message>{photo.intro}</Message>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
        {photos.map((p, i) => (
          <View key={p.id} style={{ width: "47%" }}>
            <PhotoDraftImage
              uri={p.uri}
              label={photo.photo.replace("{count}", String(i + 1))}
              errorText={photo.previewError}
              retryLabel={d.retry}
            />
          </View>
        ))}
      </View>
      <Button
        label={t.editPhotos}
        variant="text"
        onPress={() => router.navigate("/photo-draft")}
      />
      <Card>
        <Text selectable style={uiStyles.heading}>
          {details.description}
        </Text>
        {details.brand ? (
          <Text selectable style={uiStyles.body}>
            {details.brand}
          </Text>
        ) : null}
        <Text style={uiStyles.body}>{t.conditions[details.condition!]}</Text>
        {details.notes ? (
          <Text selectable style={uiStyles.body}>
            {details.notes}
          </Text>
        ) : null}
        {details.desiredPrice.trim() ? (
          <>
            <Text style={uiStyles.body}>
              {t.desiredPrice.replace("{currency}", draft.store.currency)}
            </Text>
            <Text selectable style={uiStyles.rowTitle}>
              {details.desiredPrice} {draft.store.currency}
            </Text>
          </>
        ) : null}
        <Button
          label={t.editDetails}
          variant="text"
          onPress={() => router.navigate("/photo-details")}
        />
      </Card>
      <Card>
        <Text style={uiStyles.rowTitle}>{draft.store.name}</Text>
        {draft.store.city ? (
          <Text style={uiStyles.body}>{draft.store.city}</Text>
        ) : null}
        <Button
          label={t.changeStore}
          variant="text"
          onPress={() => router.navigate("/photo-store")}
        />
      </Card>
      <Message>{photo.saved}</Message>
      <Button
        label={d.close}
        onPress={() =>
          router.dismissTo(
            session ? "/(tabs)/items" : store ? "/login" : "/store",
          )
        }
      />
    </Screen>
  );
}

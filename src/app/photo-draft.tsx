import { Redirect } from "expo-router";
import { PhotoDraftScreen } from "@/components/photo-draft-screen";
import { externalIntakePreviewEnabled } from "@/lib/external-intake-preview";

export default function PhotoDraftRoute() {
  if (!externalIntakePreviewEnabled()) return <Redirect href="/store" />;
  return <PhotoDraftScreen />;
}

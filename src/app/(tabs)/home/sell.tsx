import { Redirect } from "expo-router";

/** Preserve old links while starting central intake at the photo step. */
export default function Sell() {
  return <Redirect href="/photo-draft" />;
}

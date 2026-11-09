/** A public build flag alone can never enable this unfinished flow in production. */
export function canPreviewExternalIntake(development: boolean, flag?: string) {
  return development && flag === "true";
}
export function externalIntakePreviewEnabled() {
  return canPreviewExternalIntake(
    typeof __DEV__ !== "undefined" && __DEV__,
    process.env.EXPO_PUBLIC_EXTERNAL_INTAKE_PREVIEW,
  );
}

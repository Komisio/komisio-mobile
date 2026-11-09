// Expo supplies this file on the build worker; local development can omit it.
module.exports = ({ config }) => ({
  ...config,
  plugins: [
    ...(config.plugins ?? []),
    [
      "expo-image-picker",
      {
        cameraPermission:
          process.env.EXPO_PUBLIC_EXTERNAL_INTAKE_PREVIEW === "true"
            ? "Komisio behöver kameran för att du ska kunna fotografera dina varor."
            : false,
        photosPermission:
          process.env.EXPO_PUBLIC_EXTERNAL_INTAKE_PREVIEW === "true"
            ? "Komisio behöver tillgång till de bilder du väljer för ditt varuutkast."
            : false,
        microphonePermission: false,
      },
    ],
  ],
  android: {
    ...config.android,
    ...(process.env.GOOGLE_SERVICES_JSON
      ? { googleServicesFile: process.env.GOOGLE_SERVICES_JSON }
      : {}),
  },
});

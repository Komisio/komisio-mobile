// Expo supplies this file on the build worker; local development can omit it.
module.exports = ({ config }) => ({
  ...config,
  plugins: [
    ...(config.plugins ?? []),
    [
      "expo-camera",
      {
        cameraPermission:
          "Komisio använder kameran för att du ska kunna fotografera dina varor.",
        microphonePermission: false,
        recordAudioAndroid: false,
        barcodeScannerEnabled: false,
      },
    ],
    [
      "expo-image-picker",
      {
        cameraPermission:
          "Komisio använder kameran för att du ska kunna fotografera dina varor.",
        photosPermission:
          "Komisio använder de bilder du väljer för att skapa ett fotoutkast av din vara.",
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

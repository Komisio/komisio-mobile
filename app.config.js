// Expo supplies this file on the build worker; local development can omit it.
module.exports = ({ config }) => ({
  ...config,
  plugins: [
    ...(config.plugins ?? []),
    [
      "expo-image-picker",
      {
        // Native picker modules are excluded from custom binaries. Use Expo Go.
        cameraPermission: false,
        photosPermission: false,
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

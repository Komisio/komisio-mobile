// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
  },
  {
    // Resolve SDK 58 conditional exports without disabling import checks.
    settings: {
      "import/resolver": { typescript: { project: "./tsconfig.json" } },
    },
  },
]);

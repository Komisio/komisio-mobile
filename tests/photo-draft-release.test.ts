import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
const require = createRequire(import.meta.url);
const cli = join(
  dirname(require.resolve("expo-modules-autolinking/package.json")),
  "bin/expo-modules-autolinking.js",
);

test("native photo permissions include iOS purpose strings and Android camera without microphone", () => {
  const result = spawnSync(
    process.execPath,
    [
      join(dirname(require.resolve("expo/package.json")), "bin/cli"),
      "config",
      "--type",
      "introspect",
      "--json",
    ],
    {
      cwd: fileURLToPath(new URL("..", import.meta.url)),
      encoding: "utf8",
      env: { ...process.env, EXPO_NO_DOTENV: "1", EXPO_NO_TELEMETRY: "1" },
    },
  );
  assert.equal(result.status, 0, result.stderr);
  const config = JSON.parse(result.stdout);
  const mods = config._internal.modResults;
  for (const name of [
    "NSCameraUsageDescription",
    "NSPhotoLibraryUsageDescription",
  ])
    assert.ok(mods.ios.infoPlist[name]?.length > 20, name);
  assert.equal(mods.ios.infoPlist.NSMicrophoneUsageDescription, undefined);
  const permissions = mods.android.manifest.manifest["uses-permission"].map(
    (p: any) => p.$,
  );
  assert.ok(
    !permissions.some(
      (p: any) =>
        p["android:name"] === "android.permission.CAMERA" &&
        p["tools:node"] === "remove",
    ),
  );
  assert.ok(
    permissions.some(
      (p: any) =>
        p["android:name"] === "android.permission.RECORD_AUDIO" &&
        p["tools:node"] === "remove",
    ),
  );
});

for (const platform of ["apple", "android"]) {
  test(`native ${platform} resolution includes the photo picker and existing app modules`, () => {
    const result = spawnSync(
      process.execPath,
      [cli, "resolve", "--platform", platform, "--json"],
      {
        cwd: fileURLToPath(new URL("..", import.meta.url)),
        encoding: "utf8",
        env: { ...process.env, NO_COLOR: "1", EAS_BUILD_PROFILE: "production" },
      },
    );
    assert.equal(result.status, 0, result.stderr);
    const modules = JSON.parse(result.stdout).modules.map(
      (m: { packageName: string }) => m.packageName,
    );
    for (const retained of [
      "expo-image-picker",
      "expo-file-system",
      "expo-notifications",
      "expo-secure-store",
      "expo-image",
      "expo-localization",
    ])
      assert.ok(modules.includes(retained), retained);
    if (platform === "android")
      assert.ok(modules.includes("expo-image-loader"));
  });
}

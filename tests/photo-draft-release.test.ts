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

for (const platform of ["apple", "android"]) {
  test(`native ${platform} resolution excludes preview modules and retains existing app modules`, () => {
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
    for (const excluded of ["expo-image-picker", "expo-image-loader"])
      assert.ok(!modules.includes(excluded), excluded);
    for (const retained of [
      "expo-file-system",
      "expo-notifications",
      "expo-secure-store",
      "expo-image",
      "expo-localization",
    ])
      assert.ok(modules.includes(retained), retained);
  });
}

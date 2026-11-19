import assert from "node:assert/strict";
import test from "node:test";
import { compilePreview } from "./helpers/compile-preview.ts";

for (const development of [false, true]) {
  test(`photo screen works without flags with __DEV__=${development}`, () => {
    const globals = { __DEV__: development, process: { env: {} } };
    const route = compilePreview(
      "app/photo-draft.tsx",
      {
        "@/components/photo-draft-screen": {
          PhotoDraftScreen: "PhotoDraftScreen",
        },
      },
      globals,
    ).default();
    assert.equal(route.type, "PhotoDraftScreen");
  });
}

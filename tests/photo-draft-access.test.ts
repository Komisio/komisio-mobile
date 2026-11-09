import assert from "node:assert/strict";
import test from "node:test";
import { compilePreview } from "./helpers/compile-preview.ts";
import { photoDraftCopy } from "../src/lib/photo-draft-copy.ts";

for (const development of [false, true]) {
  test(`photo entry and screen work without flags with __DEV__=${development}`, () => {
    const paths: string[] = [];
    const globals = { __DEV__: development, process: { env: {} } };
    const entry = compilePreview(
      "components/photo-draft-entry.tsx",
      {
        "expo-router": { router: { push: (path: string) => paths.push(path) } },
        "./ui": { Button: "Button" },
        "@/lib/i18n": { useI18n: () => ({ locale: "sv" }) },
        "@/lib/photo-draft-copy": { photoDraftCopy },
      },
      globals,
    ).PhotoDraftEntry();
    assert.equal(entry.props.label, "Fota en vara");
    entry.props.onPress();
    assert.deepEqual(paths, ["/photo-draft"]);
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

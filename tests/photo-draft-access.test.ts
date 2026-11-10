import assert from "node:assert/strict";
import test from "node:test";
import { compilePreview } from "./helpers/compile-preview.ts";
import { photoDraftCopy } from "../src/lib/photo-draft-copy.ts";
import { externalSubmissionCopy } from "../src/lib/external-submission-copy.ts";

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
        "@/lib/external-submission-copy": { externalSubmissionCopy },
        "@/lib/session": { useSession: () => ({ session: null }) },
      },
      globals,
    ).PhotoDraftEntry();
    const [photo, requests] = entry.props.children;
    assert.equal(photo.props.label, "Fota en vara");
    photo.props.onPress();
    assert.deepEqual(paths, ["/photo-draft"]);
    assert.equal(requests.props.label, "Mina förfrågningar");
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

import assert from "node:assert/strict";
import test from "node:test";
import { compilePreview } from "./helpers/compile-preview.ts";
import { photoDraftCopy } from "../src/lib/photo-draft-copy.ts";

test("a saved-photo render error has its own message and retry remounts only that preview", () => {
  const state: any[] = [];
  let cursor = 0;
  const component = compilePreview("components/photo-draft-image.tsx", {
    react: {
      useState(initial: unknown) {
        const index = cursor++;
        if (!(index in state)) state[index] = initial;
        return [
          state[index],
          (value: any) => {
            state[index] =
              typeof value === "function" ? value(state[index]) : value;
          },
        ];
      },
    },
    "expo-image": { Image: "Image" },
    "react-native": { View: "View" },
    "./ui": { Button: "Button", Message: "Message", colors: {} },
  });
  const t = photoDraftCopy("sv");
  function render() {
    cursor = 0;
    return component.PhotoDraftImage({
      uri: "file:///saved",
      label: t.photo.replace("{count}", "2"),
      errorText: t.previewError,
      retryLabel: "Försök igen",
    });
  }
  let root = render();
  const image = root.props.children[0];
  assert.equal(image.props.accessibilityLabel, "Bild 2");
  image.props.onError();
  root = render();
  const [message, retry] = root.props.children[1].props.children;
  assert.equal(message.props.children, t.previewError);
  assert.notEqual(message.props.children, t.invalid);
  retry.props.onPress();
  root = render();
  assert.equal(root.props.children[1], null);
  assert.notEqual(root.props.children[0].key, image.key);
  assert.equal(root.props.children[0].props.source.uri, "file:///saved");
});

import assert from "node:assert/strict";
import test from "node:test";
import { compilePreview } from "./helpers/compile-preview.ts";

test("SMS cells keep one native autofill input, support pasted codes and preserve disabled state", () => {
  const { PhoneCodeField } = compilePreview("components/phone-code-field.tsx", {
    react: { useState: () => [false, () => {}] },
    "react-native": { Text: "Text", View: "View", TextInput: "TextInput" },
    "./ui": { colors: {}, uiStyles: {} },
  });
  let value = "",
    submitted = 0;
  const tree = PhoneCodeField({
    label: "SMS code",
    value: "123",
    disabled: true,
    onChange: (v: string) => {
      value = v;
    },
    onSubmit: () => {
      submitted++;
    },
  });
  const [cells, input] = tree.props.children[1].props.children;
  assert.equal(cells.props.children.length, 6);
  assert.equal(cells.props.importantForAccessibility, "no-hide-descendants");
  assert.equal(input.type, "TextInput");
  assert.equal(input.props.autoComplete, "one-time-code");
  assert.equal(input.props.textContentType, "oneTimeCode");
  assert.equal(input.props.editable, false);
  assert.equal(input.props.value, "123");
  assert.equal(input.props.accessibilityLabel, "SMS code");
  input.props.onChangeText("123 4567");
  assert.equal(value, "123456");
  input.props.onChangeText("12");
  assert.equal(value, "12");
  input.props.onSubmitEditing();
  assert.equal(submitted, 1);
});

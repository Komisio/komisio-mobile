import assert from "node:assert/strict";
import test from "node:test";
import { compilePreview } from "./helpers/compile-preview.ts";
import * as gates from "../src/lib/identity-gates.ts";
import { accountAuthCopy } from "../src/lib/account-auth-copy.ts";
import { accountReturnPath } from "../src/lib/account-return-path.ts";
import { photoAnalysisCopy } from "../src/lib/photo-analysis-copy.ts";

const react = {
  useState: (value: any) => [
    typeof value === "function" ? value() : value,
    () => {},
  ],
  useRef: (value: any) => ({ current: value }),
  useEffect: () => {},
  useCallback: (value: any) => value,
};
const ui = {
  Button: "Button",
  Card: "Card",
  Field: "Field",
  Message: "Message",
  Screen: "Screen",
  uiStyles: {},
  colors: {},
};
test("a retained verified Apple identity with empty primary email returns to the central flow without a store or another provider call", () => {
  let session: any = {
    user: {
      id: "owner",
      email: "",
      email_confirmed_at: "2026-11-18",
      identities: [
        {
          user_id: "owner",
          provider: "apple",
          identity_data: { email: "relay@example.test", email_verified: true },
        },
      ],
    },
  };
  const { AccountAuthScreen } = compilePreview(
    "components/account-auth-screen.tsx",
    {
      react,
      "react-native": {
        Keyboard: { dismiss() {} },
        Platform: { OS: "ios" },
        Text: "Text",
        View: "View",
      },
      "expo-router": {
        Redirect: "Redirect",
        router: {},
        useLocalSearchParams: () => ({ returnTo: "photo-review" }),
        usePreventRemove: () => () => {},
      },
      "./ui": ui,
      "./apple-account-button": { AppleAccountButton: "AppleButton" },
      "./google-account-button": { GoogleAccountButton: "GoogleButton" },
      "./privacy-link": { PrivacyLink: "Privacy" },
      "@/lib/account-auth-runtime": {
        accountAuth: {},
        connectAccountProvider: () => {
          throw new Error("Must not start another provider flow");
        },
      },
      "@/lib/account-auth": {},
      "@/lib/account-auth-copy": { accountAuthCopy },
      "@/lib/account-return-path": { accountReturnPath },
      "@/lib/identity-gates": gates,
      "@/lib/i18n": { useI18n: () => ({ locale: "sv" }) },
      "@/lib/session": { useSession: () => ({ session, store: null }) },
    },
  );
  const tree = AccountAuthScreen({});
  assert.equal(tree.type, "Redirect");
  assert.equal(tree.props.href, accountReturnPath("photo-review"));
  session = { user: { id: "owner", phone: "+46700000000" } };
  assert.equal(
    AccountAuthScreen({}).props.href,
    "/account-methods",
    "an unsupported retained session is completed explicitly instead of failing as an account switch",
  );
});

test("the actual photo panel starts guest suggestions without accessing any auth module or rendering a login step", async () => {
  const calls: string[] = [],
    effects: (() => unknown)[] = [];
  const output = {
    description: "Dress",
    brand: null,
    condition: "good",
    notes: "",
  };
  const { PhotoAnalysisPanel } = compilePreview(
    "components/photo-analysis-panel.tsx",
    {
      react,
      "expo-router": {
        useFocusEffect: (effect: () => unknown) => effects.push(effect),
      },
      "react-native": {
        ActivityIndicator: "ActivityIndicator",
        Text: "Text",
        View: "View",
      },
      "@/lib/i18n": { useI18n: () => ({ locale: "sv" }) },
      "@/lib/photo-analysis-copy": { photoAnalysisCopy },
      "@/lib/guest-photo-analysis-runtime": {
        guestPhotoAnalysis: async () => ({
          prepare: async () => {
            calls.push("prepare");
          },
          analyze: async () => {
            calls.push("analyze");
            return { status: "ready", output };
          },
        }),
      },
      "./ui": ui,
    },
  );
  let suggestion: any = null;
  const wrapper = PhotoAnalysisPanel({
    snapshot: {
      draft: { draftId: "draft", store: { id: "central" } },
      photos: [{ id: "photo" }],
    },
    disabled: false,
    onSuggestion: (v: any) => {
      suggestion = v;
    },
  });
  wrapper.type(wrapper.props);
  effects.forEach((run) => run());
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(calls, ["prepare", "analyze"]);
  assert.equal(suggestion.description, "Dress");
});

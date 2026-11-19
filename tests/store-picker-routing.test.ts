import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";
import { compilePreview } from "./helpers/compile-preview.ts";

const require = createRequire(import.meta.url);
// Use the installed SDK's actual navigation pipeline, not a mock that only
// records hrefs. POP_TO and NAVIGATE resolve differently across stack/tab edges.
const {
  createImperativeRouter,
} = require("expo-router/build/global-state/router");
const {
  resolveNavigationDestination,
} = require("expo-router/build/global-state/resolveNavigationDestination");
const { getStateFromPath } = require("expo-router/build/fork/getStateFromPath");
const {
  createInitialState,
} = require("expo-router/build/react-navigation/core/createInitialState");
const {
  StackRouter,
} = require("expo-router/build/react-navigation/routers/StackRouter");
const {
  TabRouter,
} = require("expo-router/build/react-navigation/routers/TabRouter");
const {
  indexNavigationTree,
  resolveOrigin,
  reduceNavigationTree,
} = require("expo-router/build/global-state/reduceNavigationTree");

function navigation() {
  const home = {
    ...createInitialState({
      routeNames: ["index", "stores"],
      initialRouteName: "index",
      parentChain: "home",
    }),
    type: "stack",
  };
  const tabs = {
    ...createInitialState({
      routeNames: ["home", "items", "profile"],
      initialRouteName: "home",
      parentChain: "tabs",
    }),
    type: "tab",
  };
  tabs.routes[0].state = home;
  let state = {
    ...createInitialState({
      routeNames: ["(tabs)"],
      initialRouteName: "(tabs)",
      parentChain: "root",
    }),
    type: "stack",
  };
  state.routes[0].state = tabs;
  const leaf = (route: string, children: any[] = []) => ({ route, children });
  const routeNode = leaf("", [
    leaf("(tabs)", [
      leaf("home", [leaf("index"), leaf("stores")]),
      leaf("items"),
      leaf("profile"),
    ]),
  ]);
  const registry = new Map(
    [state, tabs, home].map((s) => {
      const reducer =
        s.type === "tab"
          ? TabRouter({ initialRouteName: "home" })
          : StackRouter({});
      return [
        s.key,
        {
          reduce: (current: any, action: any) =>
            reducer.getStateForAction(current, action, {
              routeGetIdList: {},
              routeParamList: {},
            }),
          shouldActionChangeFocus: reducer.shouldActionChangeFocus,
          getStateForRouteFocus: reducer.getStateForRouteFocus,
        },
      ];
    }),
  );
  const linking = {
    screens: {
      "(tabs)": {
        path: "(tabs)",
        screens: {
          home: { path: "home", screens: { index: "", stores: "stores" } },
          items: "items",
          profile: "profile",
        },
      },
    },
  };
  const router = createImperativeRouter(
    (intent: any) => {
      const { href, options } = intent.payload;
      const action = resolveNavigationDestination({
        targetState: getStateFromPath(href, linking),
        navigationState: state,
        routeNode,
        registry,
        action: { type: options.event, payload: {} },
      });
      const tree = indexNavigationTree(state);
      const result = reduceNavigationTree(action, registry, {
        tree,
        origin: resolveOrigin(tree.rootNode, tree.nodes, registry),
      });
      if (result.handled) state = result.nextState;
    },
    () => {},
  );
  return {
    router,
    activeTab: () => {
      const s = state.routes[0].state;
      return s.routes[s.index].name;
    },
    homePages: () =>
      state.routes[0].state.routes
        .find((r: any) => r.name === "home")
        .state.routes.map((r: any) => r.name),
  };
}

function picker(router: any, chooseStore: (store: unknown) => void) {
  const store = { id: "store-a", name: "Example store", slug: "example" };
  let cursor = 0;
  const screen = compilePreview("components/store-picker-screen.tsx", {
    react: {
      useEffect() {},
      useState: () =>
        [[store], false, "", 0].map((v) => [v, () => {}])[cursor++],
    },
    "expo-router": { router },
    "react-native": { View: "View", StyleSheet: { create: (s: unknown) => s } },
    "@/lib/supabase": { supabase: {}, supabaseConfigured: true },
    "@/lib/i18n": { useI18n: () => ({ d: { store: {} } }) },
    "@/lib/session": { useSession: () => ({ chooseStore }) },
    "@/components/language-picker": { LanguagePicker: "Language" },
    "@/components/ui": {
      Button: "Button",
      NavigationRow: "Row",
      Field: "Field",
      Loading: "Loading",
      Message: "Message",
      Screen: "Screen",
    },
  });
  return () => {
    cursor = 0;
    screen
      .default()
      .props.children[1].props.children[2].props.children[0].props.onPress();
  };
}

for (const entry of ["home", "items", "profile"]) {
  test(`store selection from ${entry} activates My items and completes the Home picker`, () => {
    const nav = navigation();
    nav.router.navigate(`/(tabs)/${entry}`);
    nav.router.push("/home/stores");
    assert.equal(nav.activeTab(), "home");
    assert.deepEqual(nav.homePages(), ["index", "stores"]);
    let selected: any;
    const select = picker(nav.router, (store) => {
      selected = store;
    });
    select();
    assert.equal(selected.id, "store-a");
    assert.equal(nav.activeTab(), "items");
    assert.deepEqual(nav.homePages(), ["index"]);
    // A second selection also works after the Items tab has already mounted.
    nav.router.push("/home/stores");
    select();
    assert.equal(nav.activeTab(), "items");
    assert.deepEqual(nav.homePages(), ["index"]);
  });
}

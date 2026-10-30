import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
import {
  parsePage,
  catalogueSummary,
  formatPrice,
  type CatalogueItem,
} from "../src/lib/catalogue.ts";
import { catalogueCopy } from "../src/lib/catalogue-copy.ts";

const tenant = "00000000-0000-4000-8000-000000000001";
const item: CatalogueItem = {
  id: tenant,
  title: "Synthetic coat",
  category: "Coats",
  priceOre: 12500,
  photo: null,
};
const page = (row: unknown) => ({
  items: [row],
  total: 1,
  offset: 0,
  currency: "SEK",
});

test("list facts remain backward compatible and reject non-public or malformed facts", () => {
  assert.deepEqual(parsePage(page(item), tenant).items[0].facts, []);
  for (const facts of [
    null,
    {},
    [{ slug: "seller", value: "private" }],
    [{ slug: "size", value: 5 }],
    [
      { slug: "size", value: "M" },
      { slug: "size", value: "L" },
    ],
  ]) {
    assert.throws(() => parsePage(page({ ...item, facts }), tenant));
  }
  assert.deepEqual(
    parsePage(
      page({
        ...item,
        facts: [
          { slug: "size", value: " M " },
          { slug: "brand", value: " " },
        ],
      }),
      tenant,
    ).items[0].facts,
    [{ slug: "size", value: "M" }],
  );
});
test("summary prioritizes recorded brand, size and colour, bounds and deduplicates it", () => {
  assert.deepEqual(catalogueSummary(item), [
    { slug: "category", value: "Coats" },
  ]);
  const facts = [
    { slug: "material", value: "Wool" },
    { slug: "size", value: "M" },
    { slug: "brand", value: "Synthetic" },
    { slug: "color", value: "Blue" },
  ] as const;
  assert.deepEqual(
    catalogueSummary({ ...item, facts: [...facts] }).map((f) => f.value),
    ["Synthetic", "M", "Blue"],
  );
  assert.deepEqual(
    catalogueSummary({
      ...item,
      category: "Synthetic",
      facts: [{ slug: "brand", value: "Synthetic" }],
    }).map((f) => f.value),
    ["Synthetic"],
  );
  assert.deepEqual(catalogueSummary({ ...item, category: null }), []);
});

const require = createRequire(import.meta.url);
const { code } = require("@babel/core").transformSync(
  readFileSync(
    new URL("../src/components/catalogue-row.tsx", import.meta.url),
    "utf8",
  ),
  {
    filename: "catalogue-row.tsx",
    configFile: false,
    babelrc: false,
    presets: ["@babel/preset-typescript"],
    plugins: [
      "babel-plugin-react-compiler",
      ["@babel/plugin-transform-react-jsx", { runtime: "automatic" }],
      "@babel/plugin-transform-modules-commonjs",
    ],
  },
);
test("row keeps one full-row action, spoken facts and list-only missing-photo media", () => {
  const modules: Record<string, unknown> = {
    "react/compiler-runtime": {
      c: (n: number) => Array(n).fill(Symbol.for("react.memo_cache_sentinel")),
    },
    "react/jsx-runtime": require("react/jsx-runtime"),
    "react-native": {
      View: "View",
      Text: "Text",
      StyleSheet: { create: (x: unknown) => x },
    },
    "expo-image": { Image: "Image" },
    "@/lib/catalogue": { catalogueSummary, formatPrice },
    "@/lib/i18n": {
      useI18n: () => ({ locale: "sv", d: { catalogue: catalogueCopy.sv } }),
    },
    "./ui": { ItemCard: "ItemCard", colors: {}, uiStyles: {} },
    "./catalogue-photo": { CataloguePhoto: "Photo" },
    "../../assets/brand/mark.svg": "mark",
    "../../assets/icons/arrow-right.svg": "arrow",
  };
  const exports: any = {};
  runInNewContext(code, {
    exports,
    require: (name: string) => {
      assert.ok(Object.hasOwn(modules, name), name);
      return modules[name];
    },
  });
  let presses = 0;
  const render = (row: CatalogueItem) =>
    exports.CatalogueRow({
      item: row,
      tenant,
      currency: "SEK",
      onPress: () => presses++,
    });
  const absent = render({ ...item, facts: [{ slug: "size", value: "M" }] });
  assert.match(absent.props.label, /Storlek: M/);
  assert.match(absent.props.label, /Visa vara/);
  assert.equal(absent.props.media.type, "View");
  assert.equal(
    absent.props.trailing.props.importantForAccessibility,
    "no-hide-descendants",
  );
  assert.equal(absent.props.trailing.props.onPress, undefined);
  absent.props.onPress();
  assert.equal(presses, 1);
  const photo = {
    id: tenant,
    bucket: "item-photos" as const,
    path: `${tenant}/${tenant}/${tenant}.jpg`,
  };
  assert.equal(render({ ...item, photo }).props.media.type, "Photo");
});

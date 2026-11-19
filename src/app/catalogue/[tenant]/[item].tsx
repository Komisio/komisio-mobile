import { Redirect } from "expo-router";

// A catalogue ID is not proof of seller ownership. Resume the scoped list.
export default function CatalogueItemScreen() {
  return <Redirect href="/(tabs)/items" />;
}

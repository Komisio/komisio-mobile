import { StoreInformation } from "@/components/store-information";
import { useSession } from "@/lib/session";

export default function StoreInformationScreen() {
  const { store } = useSession();
  return store ? <StoreInformation key={store.id} store={store} /> : null;
}

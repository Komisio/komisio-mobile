import { StoreInformation } from "@/components/store-information";
import { useSession } from "@/lib/session";

export default function StoreInformationScreen() {
  const { store, session } = useSession();
  if (!store || !session) return null;
  return (
    <StoreInformation key={`${session.user.id}:${store.id}`} store={store} />
  );
}

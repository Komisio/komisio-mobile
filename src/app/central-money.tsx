import { useLocalSearchParams } from "expo-router";
import { CentralMoney } from "@/components/central-money";

export default function CentralMoneyRoute() {
  const { tenant, section } = useLocalSearchParams<{
    tenant?: string;
    section?: string;
  }>();
  return <CentralMoney tenant={tenant} bank={section === "bank"} />;
}

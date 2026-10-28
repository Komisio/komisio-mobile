import { useI18n } from "@/lib/i18n";
import { Placeholder } from "@/components/placeholder";

export default function MoneyTab() {
  const { d } = useI18n();
  return <Placeholder title={d.tabs.money} />;
}

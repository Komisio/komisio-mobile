import { useI18n } from "@/lib/i18n";
import { Placeholder } from "@/components/placeholder";

export default function OverviewTab() {
  const { d } = useI18n();
  return <Placeholder title={d.tabs.overview} />;
}

// Per-locale island entry: bundles only the en catalogue (see spec/i18n/index.ts).
import '../../spec/i18n/load/en';
import DashboardApp from '../DashboardApp';

export default function DashboardAppEn() {
  return <DashboardApp locale="en" />;
}

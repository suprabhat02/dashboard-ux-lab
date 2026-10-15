// Per-locale island entry: bundles only the ar catalogue (see spec/i18n/index.ts).
import '../../spec/i18n/load/ar';
import DashboardApp from '../DashboardApp';

export default function DashboardAppAr() {
  return <DashboardApp locale="ar" />;
}

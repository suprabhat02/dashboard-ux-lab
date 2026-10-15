// Per-locale island entry: bundles only the es catalogue (see spec/i18n/index.ts).
import '../../spec/i18n/load/es';
import DashboardApp from '../DashboardApp';

export default function DashboardAppEs() {
  return <DashboardApp locale="es" />;
}

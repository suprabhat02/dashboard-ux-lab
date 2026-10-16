// Vanilla entry for ar: bundles only the ar catalogue (see spec/i18n/index.ts).
import '../../spec/i18n/load/ar';
import { mountDashboard } from '../dashboard';

const host = document.querySelector<HTMLElement>('[data-dashboard-root]');
if (host) mountDashboard(host, 'ar');

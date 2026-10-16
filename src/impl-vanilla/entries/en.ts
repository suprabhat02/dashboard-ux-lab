// Vanilla entry for en: bundles only the en catalogue (see spec/i18n/index.ts).
import '../../spec/i18n/load/en';
import { mountDashboard } from '../dashboard';

const host = document.querySelector<HTMLElement>('[data-dashboard-root]');
if (host) mountDashboard(host, 'en');

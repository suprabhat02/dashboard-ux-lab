// Vanilla entry for es: bundles only the es catalogue (see spec/i18n/index.ts).
import '../../spec/i18n/load/es';
import { mountDashboard } from '../dashboard';

const host = document.querySelector<HTMLElement>('[data-dashboard-root]');
if (host) mountDashboard(host, 'es');

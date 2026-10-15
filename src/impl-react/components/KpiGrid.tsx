import { PREVIOUS_MONTH } from '../../spec/data';
import type { Kpi } from '../../spec/types';
import { useI18n } from '../i18n';
import { Icon } from './Icons';

function KpiCard({ kpi }: { readonly kpi: Kpi }) {
  const { t, fmt } = useI18n();
  const delta = fmt.delta(kpi, fmt.monthName(PREVIOUS_MONTH));
  return (
    <li className="kpi" data-kpi={kpi.id}>
      <p className="kpi__label">{t.dashboard.kpi[kpi.id]}</p>
      <p className="kpi__value">{fmt.value(kpi.value, kpi.format)}</p>
      {delta && (
        <p className="kpi__delta" data-tone={delta.tone}>
          <Icon name={delta.direction} size={14} />
          <span aria-hidden="true">{delta.label}</span>
          <span className="sr-only">{delta.description}</span>
        </p>
      )}
    </li>
  );
}

export function KpiGrid({ kpis }: { readonly kpis: readonly Kpi[] }) {
  const { t } = useI18n();
  return (
    <ul className="kpis" role="list" aria-label={t.dashboard.kpisLabel}>
      {kpis.map((kpi) => (
        <KpiCard key={kpi.id} kpi={kpi} />
      ))}
    </ul>
  );
}

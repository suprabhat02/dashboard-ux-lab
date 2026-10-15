import { COPY } from '../../spec/copy';
import { formatDelta, formatValue } from '../../spec/format';
import type { Kpi } from '../../spec/types';

function KpiCard({ kpi }: { readonly kpi: Kpi }) {
  const delta = formatDelta(kpi, COPY.previousMonthLabel);
  return (
    <li className="kpi" data-kpi={kpi.id}>
      <p className="kpi__label">{kpi.label}</p>
      <p className="kpi__value">{formatValue(kpi.value, kpi.format)}</p>
      {delta && (
        <p className="kpi__delta" data-tone={delta.tone}>
          <span aria-hidden="true">{delta.label}</span>
          <span className="sr-only">{delta.description}</span>
        </p>
      )}
    </li>
  );
}

export function KpiGrid({ kpis }: { readonly kpis: readonly Kpi[] }) {
  return (
    <ul className="kpis" role="list" aria-label={COPY.widgets.kpis}>
      {kpis.map((kpi) => (
        <KpiCard key={kpi.id} kpi={kpi} />
      ))}
    </ul>
  );
}

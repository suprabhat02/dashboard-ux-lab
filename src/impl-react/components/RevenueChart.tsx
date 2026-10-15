import { useId, useMemo, useState, type CSSProperties } from 'react';
import { buildChartModel, CHART } from '../../spec/chart';
import type { RevenuePoint } from '../../spec/types';
import { useI18n } from '../i18n';

/**
 * Hand-built SVG bar chart. The accessible name is a one-sentence summary of the
 * trend; the full numbers are one button away as a real table (APG disclosure).
 * Individual bars are not focusable: twelve tab stops would cost keyboard users
 * more than the table they can open instead. Geometry (including RTL mirroring)
 * comes from the spec, so this component never branches on direction.
 */
export function RevenueChart({ points }: { readonly points: readonly RevenuePoint[] }) {
  const { t, fmt, locale } = useI18n();
  const model = useMemo(() => buildChartModel(points, locale), [points, locale]);
  const [showTable, setShowTable] = useState(false);
  const tableId = useId();
  const { width, height } = CHART;
  const latest = model.bars.find((bar) => bar.isLatest);

  return (
    <>
      <div className="chart">
        <svg
          className="chart__svg"
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label={model.summary}
        >
          {model.ticks.map((tick) => (
            <g key={tick.y}>
              <line
                className="chart__grid"
                x1={model.axis.gridX1}
                x2={model.axis.gridX2}
                y1={tick.y}
                y2={tick.y}
              />
              <text
                className="chart__tick"
                x={model.axis.labelX}
                y={tick.y}
                dy="0.32em"
                textAnchor={model.axis.labelAnchor}
              >
                {tick.label}
              </text>
            </g>
          ))}
          {model.bars.map((bar, index) => (
            <g key={bar.month}>
              <rect
                className="chart__bar"
                x={bar.x}
                y={bar.y}
                width={bar.width}
                height={bar.height}
                rx={3}
                data-latest={bar.isLatest || undefined}
                style={{ '--i': index } as CSSProperties}
              >
                <title>{bar.description}</title>
              </rect>
              <text
                className="chart__label"
                x={bar.x + bar.width / 2}
                y={height - 8}
                textAnchor="middle"
              >
                {bar.shortLabel}
              </text>
            </g>
          ))}
          {latest && model.latestLabel && (
            <text
              className="chart__value"
              x={latest.x + latest.width / 2}
              y={latest.y - 6}
              textAnchor="middle"
            >
              {model.latestLabel}
            </text>
          )}
        </svg>
      </div>

      <div className="chart__toggle">
        <button
          type="button"
          className="btn btn--ghost btn--sm"
          aria-expanded={showTable}
          aria-controls={tableId}
          onClick={() => {
            setShowTable((open) => !open);
          }}
        >
          {showTable ? t.dashboard.hideTable : t.dashboard.showTable}
        </button>
      </div>

      <div id={tableId} hidden={!showTable}>
        <div className="table-scroll table-scroll--compact">
          <table className="table table--compact">
            <caption>{t.dashboard.revenueCaption}</caption>
            <thead>
              <tr>
                <th scope="col" className="table__plain-th">
                  {t.dashboard.monthHeader}
                </th>
                <th scope="col" className="table__plain-th" data-numeric>
                  {t.dashboard.columns.mrr}
                </th>
              </tr>
            </thead>
            <tbody>
              {points.map((point) => (
                <tr key={point.month}>
                  <th scope="row">{fmt.monthLong(point.month)}</th>
                  <td data-numeric>{fmt.value(point.mrr, 'currency')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

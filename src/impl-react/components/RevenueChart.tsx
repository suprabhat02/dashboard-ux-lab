import { useId, useMemo, useState, type CSSProperties } from 'react';
import { buildChartModel, CHART } from '../../spec/chart';
import { COPY } from '../../spec/copy';
import { formatCompactCurrency, formatMonthLong, formatValue } from '../../spec/format';
import type { RevenuePoint } from '../../spec/types';

/**
 * Hand-built SVG bar chart. The accessible name is a one-sentence summary of the
 * trend; the full numbers are one button away as a real table (APG disclosure).
 * Individual bars are not focusable: twelve tab stops would cost keyboard users
 * more than the table they can open instead.
 */
export function RevenueChart({ points }: { readonly points: readonly RevenuePoint[] }) {
  const model = useMemo(() => buildChartModel(points), [points]);
  const [showTable, setShowTable] = useState(false);
  const tableId = useId();
  const { padding, width, height } = CHART;
  const latest = model.bars.at(-1);
  const latestPoint = points.at(-1);

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
            <g key={tick.label}>
              <line
                className="chart__grid"
                x1={padding.left}
                x2={width - padding.right}
                y1={tick.y}
                y2={tick.y}
              />
              <text
                className="chart__tick"
                x={padding.left - 10}
                y={tick.y}
                dy="0.32em"
                textAnchor="end"
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
          {latest && latestPoint && (
            <text
              className="chart__value"
              x={latest.x + latest.width / 2}
              y={latest.y - 6}
              textAnchor="middle"
            >
              {formatCompactCurrency(latestPoint.mrr)}
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
          {showTable ? COPY.widgets.hideTable : COPY.widgets.showTable}
        </button>
      </div>

      <div id={tableId} hidden={!showTable}>
        <div className="table-scroll table-scroll--compact">
          <table className="table table--compact">
            <caption>{COPY.widgets.revenueCaption}</caption>
            <thead>
              <tr>
                <th scope="col" className="table__plain-th">
                  Month
                </th>
                <th scope="col" className="table__plain-th" data-numeric>
                  MRR
                </th>
              </tr>
            </thead>
            <tbody>
              {points.map((point) => (
                <tr key={point.month}>
                  <th scope="row">{formatMonthLong(point.month)}</th>
                  <td data-numeric>{formatValue(point.mrr, 'currency')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

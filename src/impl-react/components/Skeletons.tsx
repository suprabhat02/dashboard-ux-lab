import type { CSSProperties } from 'react';
import { CHART } from '../../spec/chart';

/** Bar heights for the chart skeleton: a gentle, fixed rhythm (never random — no flicker). */
const BAR_HEIGHTS = [48, 52, 55, 55, 62, 64, 62, 82, 80, 81, 82, 80] as const;

export function KpiSkeletons() {
  return (
    <ul className="kpis" role="list">
      {[62, 48, 58, 44].map((width, index) => (
        <li className="kpi" key={index}>
          <span
            className="skeleton skeleton--text"
            style={{ '--w': `${width}%` } as CSSProperties}
          />
          <span className="skeleton skeleton--value" />
          <span className="skeleton skeleton--pill" />
        </li>
      ))}
    </ul>
  );
}

export function ChartSkeleton() {
  return (
    <div
      className="skeleton-chart"
      style={{ aspectRatio: `${CHART.width} / ${CHART.height}` }}
    >
      {BAR_HEIGHTS.map((height, index) => (
        <span
          key={index}
          className="skeleton"
          style={{ '--h': `${height}%` } as CSSProperties}
        />
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 6 }: { readonly rows?: number }) {
  return (
    <div className="table-scroll table-scroll--fixed">
      {Array.from({ length: rows }, (_, index) => (
        <div className="skeleton-row" key={index}>
          {[80, 50, 40, 60, 55, 70].map((width, cell) => (
            <span
              key={cell}
              className="skeleton skeleton--text"
              style={{ '--w': `${width}%` } as CSSProperties}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

import { buildChartModel, CHART } from '../spec/chart';
import type { RevenuePoint } from '../spec/types';
import { h, s, uid } from './dom';
import { FOCUS_KEY, type Ctx, type ViewMemory } from './views';

/**
 * Hand-built SVG bar chart. Its accessible name is a one-sentence summary of the
 * trend; the full numbers are one button away as a real table (APG disclosure).
 * Bars are not focusable: twelve tab stops would cost keyboard users more than
 * the table they can open instead. Geometry, including RTL mirroring, comes from
 * the spec, so nothing here branches on direction.
 */
export function revenueChart(
  points: readonly RevenuePoint[],
  ctx: Ctx,
  memory: ViewMemory,
): DocumentFragment {
  const { t, fmt, locale } = ctx;
  const model = buildChartModel(points, locale);
  const { width, height } = CHART;
  const latest = model.bars.find((bar) => bar.isLatest);

  const svg = s('svg', {
    class: 'chart__svg',
    viewBox: `0 0 ${String(width)} ${String(height)}`,
    role: 'img',
    'aria-label': model.summary,
  });
  for (const tick of model.ticks) {
    svg.append(
      s(
        'g',
        {},
        s('line', {
          class: 'chart__grid',
          x1: model.axis.gridX1,
          x2: model.axis.gridX2,
          y1: tick.y,
          y2: tick.y,
        }),
        s(
          'text',
          {
            class: 'chart__tick',
            x: model.axis.labelX,
            y: tick.y,
            dy: '0.32em',
            'text-anchor': model.axis.labelAnchor,
          },
          tick.label,
        ),
      ),
    );
  }
  model.bars.forEach((bar, index) => {
    svg.append(
      s(
        'g',
        {},
        s(
          'rect',
          {
            class: 'chart__bar',
            x: bar.x,
            y: bar.y,
            width: bar.width,
            height: bar.height,
            rx: 3,
            'data-latest': bar.isLatest,
            style: { '--i': String(index) },
          },
          s('title', {}, bar.description),
        ),
        s(
          'text',
          {
            class: 'chart__label',
            x: bar.x + bar.width / 2,
            y: height - 8,
            'text-anchor': 'middle',
          },
          bar.shortLabel,
        ),
      ),
    );
  });
  if (latest && model.latestLabel) {
    svg.append(
      s(
        'text',
        {
          class: 'chart__value',
          x: latest.x + latest.width / 2,
          y: latest.y - 6,
          'text-anchor': 'middle',
        },
        model.latestLabel,
      ),
    );
  }

  const tableId = uid('revenue-table');
  const table = h(
    'div',
    { id: tableId, hidden: !memory.chartTableOpen },
    h(
      'div',
      { class: 'table-scroll table-scroll--compact' },
      h(
        'table',
        { class: 'table table--compact' },
        h('caption', {}, t.dashboard.revenueCaption),
        h(
          'thead',
          {},
          h(
            'tr',
            {},
            h('th', { scope: 'col', class: 'table__plain-th' }, t.dashboard.monthHeader),
            h(
              'th',
              { scope: 'col', class: 'table__plain-th', 'data-numeric': true },
              t.dashboard.columns.mrr,
            ),
          ),
        ),
        h(
          'tbody',
          {},
          ...points.map((point) =>
            h(
              'tr',
              {},
              h('th', { scope: 'row' }, fmt.monthLong(point.month)),
              h('td', { 'data-numeric': true }, fmt.value(point.mrr, 'currency')),
            ),
          ),
        ),
      ),
    ),
  );

  const toggle = h(
    'button',
    {
      type: 'button',
      class: 'btn btn--ghost btn--sm',
      'aria-expanded': String(memory.chartTableOpen),
      'aria-controls': tableId,
      [FOCUS_KEY]: 'chart-table-toggle',
    },
    memory.chartTableOpen ? t.dashboard.hideTable : t.dashboard.showTable,
  );
  toggle.addEventListener('click', () => {
    const open = table.hasAttribute('hidden');
    memory.chartTableOpen = open;
    table.toggleAttribute('hidden', !open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.textContent = open ? t.dashboard.hideTable : t.dashboard.showTable;
  });

  const fragment = document.createDocumentFragment();
  fragment.append(
    h('div', { class: 'chart' }, svg),
    h('div', { class: 'chart__toggle' }, toggle),
    table,
  );
  return fragment;
}

import { DIRECTIONAL_ICONS, ICONS, type IconName } from '../spec/icons';

/**
 * A few typed helpers for building DOM without a framework. Deliberately tiny:
 * no virtual DOM and no diffing. The dashboard decides what changed (see
 * dashboard.ts) and replaces or updates exactly those nodes, so focus and
 * scroll positions survive every update that does not remove the focused node.
 */

type AttrValue = string | number | boolean | null | undefined;

export type Props = Readonly<
  Record<string, AttrValue | EventListener | Readonly<Record<string, string>>>
>;

export type Child = Node | string | null | undefined | false;

function apply(el: Element, props: Props): void {
  for (const [name, value] of Object.entries(props)) {
    if (value === undefined || value === null || value === false) continue;
    if (name === 'style' && typeof value === 'object') {
      for (const [prop, v] of Object.entries(value))
        (el as HTMLElement).style.setProperty(prop, v);
    } else if (name.startsWith('on') && typeof value === 'function') {
      el.addEventListener(name.slice(2).toLowerCase(), value);
    } else if (value === true) {
      el.setAttribute(name, '');
    } else if (typeof value === 'string' || typeof value === 'number') {
      el.setAttribute(name, String(value));
    }
  }
}

function append(el: Element, children: readonly Child[]): void {
  for (const child of children) {
    if (child === null || child === undefined || child === false) continue;
    el.append(child);
  }
}

/** HTML element: `h('p', { class: 'x' }, 'text', otherNode)`. */
export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Props = {},
  ...children: readonly Child[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  apply(el, props);
  append(el, children);
  return el;
}

const SVG_NS = 'http://www.w3.org/2000/svg';

/** SVG element, in the SVG namespace. */
export function s<K extends keyof SVGElementTagNameMap>(
  tag: K,
  props: Props = {},
  ...children: readonly Child[]
): SVGElementTagNameMap[K] {
  const el = document.createElementNS(SVG_NS, tag);
  apply(el, props);
  append(el, children);
  return el;
}

/** Lucide icon from the shared registry. Decorative: hidden from assistive tech. */
export function icon(name: IconName, size = 20, className?: string): SVGSVGElement {
  const classes = [className, DIRECTIONAL_ICONS.has(name) ? 'icon-flip' : undefined]
    .filter(Boolean)
    .join(' ');
  const svg = s('svg', {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': 2,
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
    'aria-hidden': 'true',
    focusable: 'false',
    class: classes || undefined,
  });
  for (const [tag, attrs] of ICONS[name]) {
    svg.append(s(tag as keyof SVGElementTagNameMap, attrs as Props));
  }
  return svg;
}

let counter = 0;
/** Unique id for ARIA relationships, stable for the life of the node. */
export function uid(prefix: string): string {
  counter += 1;
  return `${prefix}-${String(counter)}`;
}

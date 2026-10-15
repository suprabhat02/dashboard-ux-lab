import { createElement, type SVGProps } from 'react';
import { DIRECTIONAL_ICONS, ICONS, type IconName } from '../../spec/icons';

/** Lucide icon from the shared registry. Decorative: hidden from assistive tech. */
export function Icon({
  name,
  size = 20,
  className,
  ...props
}: { readonly name: IconName; readonly size?: number } & Omit<
  SVGProps<SVGSVGElement>,
  'name'
>) {
  const classes = [className, DIRECTIONAL_ICONS.has(name) ? 'icon-flip' : undefined]
    .filter(Boolean)
    .join(' ');
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={classes || undefined}
      {...props}
    >
      {ICONS[name].map(([tag, attrs], index) =>
        createElement(tag, { key: index, ...attrs }),
      )}
    </svg>
  );
}

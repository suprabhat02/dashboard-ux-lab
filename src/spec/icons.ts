/**
 * Icon registry: Lucide (ISC licence) consumed as plain data, so every renderer —
 * Astro pages, the React implementation and the future vanilla one — draws the
 * same glyphs without a framework-specific icon package.
 *
 * Only icons listed here are bundled (Lucide exports are tree-shakable).
 */
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  ChartColumnBig,
  Check,
  ChevronDown,
  CircleStop,
  Clock,
  Copy,
  Ear,
  Focus,
  Globe,
  Hourglass,
  LayoutDashboard,
  Lock,
  Menu,
  Minus,
  Monitor,
  Moon,
  Pause,
  Play,
  RotateCw,
  SearchX,
  ServerCrash,
  ShieldAlert,
  Sun,
  type IconNode,
} from 'lucide';

export type { IconNode };

export const ICONS = {
  logo: LayoutDashboard,
  menu: Menu,
  language: Globe,
  chevronDown: ChevronDown,
  check: Check,
  sun: Sun,
  moon: Moon,
  system: Monitor,
  copy: Copy,
  retry: RotateCw,
  cancel: CircleStop,
  sort: ChevronDown,
  up: ArrowUp,
  down: ArrowDown,
  flat: Minus,
  arrow: ArrowRight,
  play: Play,
  pause: Pause,
  // Scenario and state icons
  loaded: ChartColumnBig,
  loading: Hourglass,
  slow: Clock,
  empty: SearchX,
  error: ServerCrash,
  restricted: Lock,
  forbidden: ShieldAlert,
  // Inspector
  announce: Ear,
  focus: Focus,
} as const satisfies Record<string, IconNode>;

export type IconName = keyof typeof ICONS;

/** Icons that point in the reading direction and must mirror in right-to-left layouts. */
export const DIRECTIONAL_ICONS: ReadonlySet<IconName> = new Set<IconName>([
  'retry',
  'arrow',
]);

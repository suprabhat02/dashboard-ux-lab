/**
 * Home page behaviour: the request console in the hero (the page's one
 * orchestrated moment) and the pausable logo strip.
 *
 * Each scenario is replayed in real time: the playhead runs along the ruler and
 * the miniature dashboard passes through the phases the spec defines (nothing for
 * 300 ms, placeholders, "slow" at 3 s, Cancel at 8 s) until its response lands.
 * Under prefers-reduced-motion nothing moves: a scenario jumps to the one frame
 * that explains it best (see REPRESENTATIVE in ruler.ts).
 *
 * Framework-free and small: it ships on the landing page, where every byte
 * competes with first paint.
 */
import { phaseAt, rulerPosition, type DemoPhase } from './ruler';

/** How long a finished state stays on screen before the next one plays. */
const HOLD_MS = 2600;

type Hold = 'focus' | 'hover' | 'offscreen' | 'hidden';

const reducedMotion = (): boolean =>
  matchMedia('(prefers-reduced-motion: reduce)').matches;

function query(root: ParentNode, selector: string): HTMLElement {
  const element = root.querySelector<HTMLElement>(selector);
  if (!element) throw new Error(`home: missing ${selector}`);
  return element;
}

/** APG tabbed carousel: tabs with automatic activation plus a rotation control. */
export function initStateDemo(root: HTMLElement): () => void {
  const tabs = [...root.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
  const panelsBox = query(root, '[data-demo-panels]');
  const mock = query(root, '[data-demo-mock]');
  const toggle = query(root, '[data-demo-toggle]');
  const labels = {
    play: root.dataset.labelPlay ?? '',
    pause: root.dataset.labelPause ?? '',
  };
  if (tabs.length === 0) return () => undefined;

  let current = Math.max(
    0,
    tabs.findIndex((tab) => tab.getAttribute('aria-selected') === 'true'),
  );
  /** The visitor's choice: rotation is wanted. Holds are separate, temporary pauses. */
  let playing = !reducedMotion();
  const holds = new Set<Hold>();
  let frame = 0;
  let timer: number | undefined;
  /** True once the current scenario's response has landed. */
  let settled = false;

  const panelFor = (tab: HTMLButtonElement): HTMLElement | null =>
    document.getElementById(tab.getAttribute('aria-controls') ?? '');

  const show = (phase: DemoPhase, atMs: number): void => {
    mock.dataset.phase = phase;
    root.style.setProperty('--t', rulerPosition(atMs).toFixed(4));
  };

  /** Plays the current scenario's request from 0 ms, or shows its key frame. */
  function replay(): void {
    cancelAnimationFrame(frame);
    const tab = tabs[current];
    if (!tab) return;
    const latency = Number(tab.dataset.latency ?? 0);
    root.style.setProperty('--resp', rulerPosition(latency).toFixed(4));
    settled = false;
    if (reducedMotion()) {
      show(
        (tab.dataset.repPhase ?? 'done') as DemoPhase,
        Number(tab.dataset.repAt ?? latency),
      );
      settled = true;
      return;
    }
    const start = performance.now();
    const step = (now: number): void => {
      const elapsed = Math.min(now - start, latency);
      show(phaseAt(elapsed, latency), elapsed);
      if (elapsed < latency) {
        frame = requestAnimationFrame(step);
        return;
      }
      settled = true;
      schedule();
    };
    frame = requestAnimationFrame(step);
  }

  function select(index: number, moveFocus: boolean): void {
    current = (index + tabs.length) % tabs.length;
    tabs.forEach((tab, i) => {
      const selected = i === current;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      const panel = panelFor(tab);
      if (panel) panel.hidden = !selected;
    });
    const active = tabs[current];
    if (!active) return;
    mock.dataset.state = active.dataset.state ?? '';
    if (moveFocus) active.focus();
    replay();
  }

  /** Reflects the play state and, once a response has landed, queues the next one. */
  function schedule(): void {
    window.clearTimeout(timer);
    timer = undefined;
    const running = playing && holds.size === 0;
    root.dataset.playing = String(running);
    // APG: announce panel changes only when the visitor is driving them.
    panelsBox.setAttribute('aria-live', playing ? 'off' : 'polite');
    toggle.setAttribute('aria-label', playing ? labels.pause : labels.play);
    toggle.dataset.playing = String(playing);
    if (!running || !settled) return;
    timer = window.setTimeout(() => {
      select(current + 1, false);
    }, HOLD_MS);
  }

  function stopByUser(): void {
    playing = false;
    schedule();
  }

  const onTabClick = (event: MouseEvent): void => {
    const index = tabs.indexOf(event.currentTarget as HTMLButtonElement);
    stopByUser();
    select(index, false);
  };

  const onKeyDown = (event: KeyboardEvent): void => {
    const rtl = getComputedStyle(root).direction === 'rtl';
    const step = { ArrowRight: rtl ? -1 : 1, ArrowLeft: rtl ? 1 : -1 } as const;
    let next: number | undefined;
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft')
      next = current + step[event.key];
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = tabs.length - 1;
    if (next === undefined) return;
    event.preventDefault();
    stopByUser();
    select(next, true);
  };

  const onToggle = (): void => {
    playing = !playing;
    // A deliberate Play starts the next request at once, even while focus is here.
    holds.delete('focus');
    holds.delete('hover');
    if (playing) {
      select(current + 1, false);
    } else {
      // Pause freezes everything, including a request mid-flight (WCAG 2.2.2).
      cancelAnimationFrame(frame);
      settled = true;
    }
    schedule();
  };

  const hold = (reason: Hold, on: boolean): void => {
    if (on) holds.add(reason);
    else holds.delete(reason);
    schedule();
  };
  const onFocusIn = (event: FocusEvent): void => {
    if (event.target !== toggle) hold('focus', true);
  };
  const onFocusOut = (event: FocusEvent): void => {
    if (!root.contains(event.relatedTarget as Node | null)) hold('focus', false);
  };
  const onEnter = (): void => {
    hold('hover', true);
  };
  const onLeave = (): void => {
    hold('hover', false);
  };
  const onVisibility = (): void => {
    hold('hidden', document.hidden);
  };

  let started = false;
  const observer = new IntersectionObserver(
    ([entry]) => {
      if (!entry) return;
      // The first replay waits until the console is actually on screen.
      if (entry.isIntersecting && !started) {
        started = true;
        select(current, false);
      }
      hold('offscreen', !entry.isIntersecting);
    },
    { threshold: 0.25 },
  );

  tabs.forEach((tab) => {
    tab.addEventListener('click', onTabClick);
  });
  root
    .querySelector('[role="tablist"]')
    ?.addEventListener('keydown', onKeyDown as EventListener);
  toggle.addEventListener('click', onToggle);
  root.addEventListener('focusin', onFocusIn);
  root.addEventListener('focusout', onFocusOut);
  root.addEventListener('pointerenter', onEnter);
  root.addEventListener('pointerleave', onLeave);
  document.addEventListener('visibilitychange', onVisibility);
  holds.add('offscreen');
  observer.observe(root);
  schedule();

  return () => {
    window.clearTimeout(timer);
    cancelAnimationFrame(frame);
    observer.disconnect();
    document.removeEventListener('visibilitychange', onVisibility);
  };
}

/**
 * The logo strip: moves only without reduced motion, pauses off screen, and the
 * Pause button stops it for good (WCAG 2.2.2). The movement itself is CSS.
 */
export function initMarquee(root: HTMLElement): void {
  if (reducedMotion()) return;
  const toggle = root.querySelector<HTMLButtonElement>('[data-marquee-toggle]');
  if (!toggle) return;
  const labels = {
    play: toggle.dataset.labelPlay ?? '',
    pause: toggle.dataset.labelPause ?? '',
  };
  root.dataset.moving = '';
  toggle.addEventListener('click', () => {
    const pausing = root.dataset.paused === undefined;
    if (pausing) root.dataset.paused = '';
    else delete root.dataset.paused;
    toggle.setAttribute('aria-label', pausing ? labels.play : labels.pause);
  });
  new IntersectionObserver(([entry]) => {
    if (!entry) return;
    if (entry.isIntersecting) delete root.dataset.offscreen;
    else root.dataset.offscreen = '';
  }).observe(root);
}

export function initHome(): void {
  const marquee = document.querySelector<HTMLElement>('[data-marquee]');
  if (marquee) initMarquee(marquee);
  const demo = document.querySelector<HTMLElement>('[data-demo]');
  if (demo) initStateDemo(demo);
}

/**
 * Home page behaviour: the live state preview and a pointer tilt on it.
 *
 * Everything else on the page (reveals, the scroll progress bar, the statement)
 * is CSS-only, driven by scroll timelines and gated on prefers-reduced-motion.
 * This module stays framework-free and small: it ships on the landing page,
 * where every byte competes with first paint.
 */

const ROTATE_MS = 4200;
const TILT_DEG = 4;

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
  const progress = root.querySelector<HTMLElement>('.demo__progress');
  const labels = {
    play: root.dataset.labelPlay ?? '',
    pause: root.dataset.labelPause ?? '',
  };
  if (tabs.length === 0) return () => undefined;

  let current = Math.max(
    0,
    tabs.findIndex((tab) => tab.getAttribute('aria-selected') === 'true'),
  );
  /** The visitor's choice: rotation is wanted. Holds (focus, hover, off-screen) are separate. */
  let playing = !reducedMotion();
  const holds = new Set<'focus' | 'hover' | 'offscreen' | 'hidden'>();
  let timer: number | undefined;

  const panelFor = (tab: HTMLButtonElement): HTMLElement | null =>
    document.getElementById(tab.getAttribute('aria-controls') ?? '');

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
  }

  function schedule(): void {
    window.clearTimeout(timer);
    timer = undefined;
    const running = playing && holds.size === 0;
    root.dataset.playing = String(running);
    // APG: announce panel changes only when the visitor is driving them.
    panelsBox.setAttribute('aria-live', playing ? 'off' : 'polite');
    toggle.setAttribute('aria-label', playing ? labels.pause : labels.play);
    toggle.dataset.playing = String(playing);
    if (!running) return;
    // Restart the countdown bar so it always matches the time to the next state.
    for (const animation of progress?.getAnimations() ?? []) animation.currentTime = 0;
    timer = window.setTimeout(() => {
      select(current + 1, false);
      schedule();
    }, ROTATE_MS);
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
    // A deliberate Play should start immediately, even while the button has focus.
    holds.delete('focus');
    holds.delete('hover');
    if (playing) select(current + 1, false);
    schedule();
  };

  const hold = (
    reason: 'focus' | 'hover' | 'offscreen' | 'hidden',
    on: boolean,
  ): void => {
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

  const stage = query(root, '.demo__layout');
  const observer = new IntersectionObserver(
    ([entry]) => {
      if (entry) hold('offscreen', !entry.isIntersecting);
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
  stage.addEventListener('pointerenter', onEnter);
  stage.addEventListener('pointerleave', onLeave);
  document.addEventListener('visibilitychange', onVisibility);
  holds.add('offscreen');
  observer.observe(stage);
  select(current, false);
  schedule();

  return () => {
    window.clearTimeout(timer);
    observer.disconnect();
    document.removeEventListener('visibilitychange', onVisibility);
  };
}

/** Gentle 3D tilt that follows a fine pointer. rAF-throttled; transform only. */
export function initTilt(element: HTMLElement): void {
  const canTilt =
    matchMedia('(hover: hover) and (pointer: fine)').matches && !reducedMotion();
  if (!canTilt) return;
  let frame = 0;
  let x = 0;
  let y = 0;
  const apply = (): void => {
    frame = 0;
    element.style.setProperty('--tilt-x', `${(-y * TILT_DEG).toFixed(2)}deg`);
    element.style.setProperty('--tilt-y', `${(x * TILT_DEG).toFixed(2)}deg`);
  };
  element.addEventListener('pointermove', (event) => {
    const box = element.getBoundingClientRect();
    x = (event.clientX - box.left) / box.width - 0.5;
    y = (event.clientY - box.top) / box.height - 0.5;
    frame ||= requestAnimationFrame(apply);
  });
  element.addEventListener('pointerleave', () => {
    x = 0;
    y = 0;
    frame ||= requestAnimationFrame(apply);
  });
}

/**
 * Number ticker: counts up to the value already in the HTML when it scrolls into
 * view. The final number is the server-rendered text, so nothing depends on this.
 */
export function initTickers(elements: Iterable<HTMLElement>): void {
  if (reducedMotion()) return;
  const DURATION_MS = 1100;
  const run = (element: HTMLElement): void => {
    const target = Number(element.dataset.ticker);
    if (!Number.isFinite(target)) return;
    const start = performance.now();
    const step = (now: number): void => {
      const progress = Math.min(1, (now - start) / DURATION_MS);
      const eased = 1 - (1 - progress) ** 3;
      element.textContent = String(Math.round(target * eased));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        observer.unobserve(entry.target);
        run(entry.target as HTMLElement);
      }
    },
    { threshold: 0.6 },
  );
  for (const element of elements) observer.observe(element);
}

/**
 * Aceternity "Card Hover Effect": one surface glides to the tile under the pointer
 * or keyboard focus. The surface is decorative; tiles stay plain links.
 */
export function initHoverCards(wrap: HTMLElement): void {
  const glow = wrap.querySelector<HTMLElement>('[data-hover-glow]');
  if (!glow) return;
  wrap.dataset.ready = '';
  const moveTo = (tile: HTMLElement): void => {
    const outer = wrap.getBoundingClientRect();
    const box = tile.getBoundingClientRect();
    glow.style.setProperty('--glow-x', `${String(box.left - outer.left)}px`);
    glow.style.setProperty('--glow-y', `${String(box.top - outer.top)}px`);
    glow.style.setProperty('--glow-w', `${String(box.width)}px`);
    glow.style.setProperty('--glow-h', `${String(box.height)}px`);
    wrap.dataset.active = '';
  };
  const clear = (): void => {
    delete wrap.dataset.active;
  };
  const tileFrom = (target: EventTarget | null): HTMLElement | null =>
    target instanceof Element ? target.closest<HTMLElement>('.tile') : null;

  wrap.addEventListener('pointerover', (event) => {
    const tile = tileFrom(event.target);
    if (tile) moveTo(tile);
  });
  wrap.addEventListener('pointerleave', clear);
  wrap.addEventListener('focusin', (event) => {
    const tile = tileFrom(event.target);
    if (tile) moveTo(tile);
  });
  wrap.addEventListener('focusout', (event) => {
    if (!wrap.contains(event.relatedTarget as Node | null)) clear();
  });
  window.addEventListener('resize', clear, { passive: true });
}

/**
 * Aceternity "Infinite Moving Cards", as a strip of names. Moves only without
 * reduced motion and while on screen; pauses on hover or focus; the Pause button
 * satisfies WCAG 2.2.2. Otherwise it is a static, wrapped list.
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
    const paused = root.dataset.paused === undefined;
    if (paused) root.dataset.paused = '';
    else delete root.dataset.paused;
    toggle.setAttribute('aria-label', paused ? labels.play : labels.pause);
  });
  new IntersectionObserver(([entry]) => {
    if (!entry) return;
    if (entry.isIntersecting) delete root.dataset.offscreen;
    else root.dataset.offscreen = '';
  }).observe(root);
}

export function initHome(): void {
  initTickers(document.querySelectorAll<HTMLElement>('[data-ticker]'));
  const cards = document.querySelector<HTMLElement>('[data-hover-cards]');
  if (cards) initHoverCards(cards);
  const marquee = document.querySelector<HTMLElement>('[data-marquee]');
  if (marquee) initMarquee(marquee);
  const demo = document.querySelector<HTMLElement>('[data-demo]');
  if (demo) initStateDemo(demo);
  const tilt = document.querySelector<HTMLElement>('[data-demo-tilt]');
  if (tilt) initTilt(tilt);
}

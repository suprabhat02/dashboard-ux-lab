/**
 * Header behaviour: the "scrolled" state of the floating bar, and the highlight
 * that glides to the hovered or focused nav link and rests on the current page.
 * Paint-only (translate, width), rAF-throttled, and still under reduced motion
 * (the CSS drops the transition, so the highlight jumps instead of gliding).
 */
export function initHeader(): void {
  const header = document.querySelector<HTMLElement>('.site-header');
  if (!header) return;

  let frame = 0;
  const onScroll = (): void => {
    frame ||= requestAnimationFrame(() => {
      frame = 0;
      header.toggleAttribute('data-scrolled', window.scrollY > 8);
    });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const nav = header.querySelector<HTMLElement>('[data-site-nav]');
  const pill = nav?.querySelector<HTMLElement>('.site-nav__pill');
  if (!nav || !pill) return;
  const current = nav.querySelector<HTMLElement>('a[aria-current="page"]');

  const moveTo = (link: HTMLElement | null): void => {
    // No link, or one that is not rendered (offsetParent is null when hidden).
    if (!link?.offsetParent) {
      nav.removeAttribute('data-pill');
      return;
    }
    const box = link.getBoundingClientRect();
    const origin = nav.getBoundingClientRect();
    // The pill is anchored at the inline start: the right edge in Arabic.
    const rtl = getComputedStyle(nav).direction === 'rtl';
    const x = rtl ? box.right - origin.right : box.left - origin.left;
    pill.style.setProperty('--pill-x', `${String(x)}px`);
    pill.style.setProperty('--pill-w', `${String(box.width)}px`);
    nav.setAttribute('data-pill', '');
  };
  const linkFrom = (target: EventTarget | null): HTMLElement | null =>
    target instanceof Element ? target.closest<HTMLElement>('a') : null;

  moveTo(current);
  // Enable the glide only after the first placement, so it never slides in on load.
  requestAnimationFrame(() => {
    nav.setAttribute('data-pill-ready', '');
  });
  nav.addEventListener('pointerover', (event) => {
    const link = linkFrom(event.target);
    if (link) moveTo(link);
  });
  nav.addEventListener('pointerleave', () => {
    moveTo(current);
  });
  nav.addEventListener('focusin', (event) => {
    moveTo(linkFrom(event.target));
  });
  nav.addEventListener('focusout', (event) => {
    if (!nav.contains(event.relatedTarget as Node | null)) moveTo(current);
  });
  // Re-place it whenever the links change size: a late web font, a resize, zoom.
  new ResizeObserver(() => {
    if (!nav.matches(':hover, :focus-within')) moveTo(current);
  }).observe(nav);
}

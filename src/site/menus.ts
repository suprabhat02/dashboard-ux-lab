/**
 * Header dropdowns and the theme choice. Plain DOM, shared by every page.
 */

const THEME_KEY = 'dux-theme';
type ThemeChoice = 'light' | 'dark' | 'system';

function closeMenu(menu: HTMLElement, returnFocus = false): void {
  const button = menu.querySelector<HTMLButtonElement>('[data-menu-button]');
  const panel = menu.querySelector<HTMLElement>('[data-menu-panel]');
  if (!button || !panel || panel.hidden) return;
  button.setAttribute('aria-expanded', 'false');
  panel.hidden = true;
  if (returnFocus) button.focus();
}

function initMenus(): void {
  const menus = Array.from(document.querySelectorAll<HTMLElement>('[data-menu]'));
  for (const menu of menus) {
    const button = menu.querySelector<HTMLButtonElement>('[data-menu-button]');
    const panel = menu.querySelector<HTMLElement>('[data-menu-panel]');
    if (!button || !panel) continue;

    button.addEventListener('click', () => {
      const opening = panel.hidden;
      for (const other of menus) if (other !== menu) closeMenu(other);
      button.setAttribute('aria-expanded', String(opening));
      panel.hidden = !opening;
    });
    menu.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !panel.hidden) {
        event.preventDefault();
        closeMenu(menu, true);
      }
    });
    menu.addEventListener('focusout', (event) => {
      const next = event.relatedTarget;
      if (next instanceof Node && !menu.contains(next)) closeMenu(menu);
    });
  }
  document.addEventListener('click', (event) => {
    const target = event.target;
    for (const menu of menus)
      if (target instanceof Node && !menu.contains(target)) closeMenu(menu);
  });
}

function storedTheme(): ThemeChoice {
  try {
    const value = localStorage.getItem(THEME_KEY);
    return value === 'light' || value === 'dark' ? value : 'system';
  } catch {
    return 'system';
  }
}

function applyTheme(choice: ThemeChoice): void {
  const root = document.documentElement;
  if (choice === 'system') delete root.dataset.theme;
  else root.dataset.theme = choice;
  try {
    if (choice === 'system') localStorage.removeItem(THEME_KEY);
    else localStorage.setItem(THEME_KEY, choice);
  } catch {
    /* storage unavailable: the choice lasts for this page view */
  }
  for (const option of document.querySelectorAll<HTMLButtonElement>(
    '[data-theme-option]',
  )) {
    option.setAttribute('aria-pressed', String(option.dataset.themeOption === choice));
  }
  const trigger = document.querySelector<HTMLElement>('[data-theme-menu]');
  if (trigger) trigger.dataset.current = choice;
}

function initTheme(): void {
  applyTheme(storedTheme());
  for (const option of document.querySelectorAll<HTMLButtonElement>(
    '[data-theme-option]',
  )) {
    option.addEventListener('click', () => {
      const choice = option.dataset.themeOption;
      if (choice === 'light' || choice === 'dark' || choice === 'system')
        applyTheme(choice);
    });
  }
}

/** Carry the lab's query string across when switching language. */
function initLocaleLinks(): void {
  for (const link of document.querySelectorAll<HTMLAnchorElement>('[data-locale-link]')) {
    link.addEventListener('click', () => {
      link.search = window.location.search;
    });
  }
}

initMenus();
initTheme();
initLocaleLinks();

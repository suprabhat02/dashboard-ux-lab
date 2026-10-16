// Renders the social preview cards (public/og/<locale>.png, 1200 × 630) and the
// app icons (public/apple-touch-icon.png, public/icon-192.png, public/icon-512.png).
//
// Run after changing the copy below or the brand colours:
//   CHROMIUM_PATH=/path/to/chromium node scripts/generate-og.mjs
// The outputs are committed, so CI and deploys never need a browser for this.
//
// The card repeats the home page's idea: a request drawn as a ruler from 0 to
// 12 s, with the spec's thresholds marked. Titles mirror home.hero.title.
import { mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from '@playwright/test';
import sharp from 'sharp';

const ROOT = new URL('../', import.meta.url).pathname;
const OUT = join(ROOT, 'public');
const LIME = '#c8ff00';
const BIO = '#06110d';

const font = (pkg, file) =>
  readFileSync(
    join(ROOT, 'node_modules/@fontsource-variable', pkg, 'files', file),
  ).toString('base64');
const bricolage = font(
  'bricolage-grotesque',
  'bricolage-grotesque-latin-opsz-normal.woff2',
);
const kufi = font('noto-kufi-arabic', 'noto-kufi-arabic-arabic-wght-normal.woff2');

const CARDS = {
  en: {
    dir: 'ltr',
    title: 'Design the dashboard states nobody screenshots',
    marks: ['Placeholders', 'Says it is slow', 'Offers Cancel'],
  },
  es: {
    dir: 'ltr',
    title: 'Diseña los estados del panel que nadie captura en pantalla',
    marks: ['Marcadores', 'Avisa de la demora', 'Ofrece cancelar'],
  },
  ar: {
    dir: 'rtl',
    title: 'صمّم حالات لوحة المعلومات التي لا تظهر في أي لقطة شاشة',
    marks: ['العناصر المؤقتة', 'يُعلن عن التأخير', 'يعرض الإلغاء'],
  },
};

/* Same square-root scale as src/site/ruler.ts. */
const pos = (ms) => Math.sqrt(ms / 12000) * 100;

const card = ({ dir, title, marks }) => `<!doctype html>
<html dir="${dir}"><head><meta charset="utf-8"><style>
@font-face{font-family:B;src:url(data:font/woff2;base64,${bricolage}) format('woff2');font-weight:200 800}
@font-face{font-family:K;src:url(data:font/woff2;base64,${kufi}) format('woff2');font-weight:100 900}
*{box-sizing:border-box;margin:0}
body{width:1200px;height:630px;background:${BIO};color:#ecf3ec;font-family:B,K,sans-serif;
  padding:72px 80px 64px;display:flex;flex-direction:column;justify-content:space-between}
.top{display:flex;align-items:center;justify-content:space-between;gap:24px}
.brand{display:flex;align-items:center;gap:14px;font-size:28px;font-weight:700;color:${LIME}}
.url{font-size:24px;font-weight:600;color:#b3c2b8;direction:ltr}
.brand svg{width:36px;height:36px}
h1{font-size:${dir === 'rtl' ? 64 : 76}px;line-height:${dir === 'rtl' ? 1.25 : 0.98};font-weight:800;
  letter-spacing:${dir === 'rtl' ? 0 : '-0.035em'};max-width:930px}
.ruler{position:relative;height:84px}
.track{position:absolute;inset-inline:0;top:0;height:6px;border-radius:3px;background:#24372d}
.fill{position:absolute;inset-inline-start:0;top:0;height:6px;border-radius:3px;background:${LIME};width:${pos(9000)}%}
.head{position:absolute;top:-9px;inset-inline-start:calc(${pos(9000)}% - 12px);width:24px;height:24px;border-radius:50%;background:${LIME};box-shadow:0 0 0 4px ${BIO}}
.mark{position:absolute;top:24px;display:grid;justify-items:center;gap:2px;white-space:nowrap;translate:${dir === 'rtl' ? '50%' : '-50%'} 0}
.mark b{font-size:24px;font-weight:700;color:#ecf3ec;direction:ltr;unicode-bidi:isolate}
.mark span{font-size:20px;font-weight:500;color:#b3c2b8}
.mark::before{content:'';position:absolute;top:-28px;inset-inline-start:calc(50% - 1px);width:2px;height:14px;background:#8a9b90}
</style></head><body>
<div class="top"><div class="brand"><svg viewBox="0 0 32 32" fill="none" stroke="${LIME}" stroke-width="2.4" stroke-linejoin="round"><path d="M5 5h8v10H5zM19 5h8v6h-8zM19 15h8v12h-8zM5 19h8v8H5z"/></svg>Dashboard UX Lab</div><span class="url">lab.suprabhat-dev.com</span></div>
<h1>${title}</h1>
<div class="ruler"><span class="track"></span><span class="fill"></span><span class="head"></span>
${marks.map((label, i) => `<span class="mark" style="inset-inline-start:${pos([300, 3000, 8000][i])}%"><b>${['300 ms', '3 s', '8 s'][i]}</b><span>${label}</span></span>`).join('')}</div>
</body></html>`;

mkdirSync(join(OUT, 'og'), { recursive: true });
const browser = await chromium.launch({
  ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}),
  args: (process.env.CHROMIUM_ARGS ?? '').split(' ').filter(Boolean),
});
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
for (const [locale, data] of Object.entries(CARDS)) {
  await page.setContent(card(data), { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  const png = await page.screenshot({ type: 'png' });
  await sharp(png)
    .png({ compressionLevel: 9, palette: true, quality: 90 })
    .toFile(join(OUT, 'og', `${locale}.png`));
  console.log(`✓ public/og/${locale}.png`);
}
await browser.close();

// App icons from the favicon: a lime mark on bio black, with padding for masks.
const favicon = readFileSync(join(OUT, 'favicon.svg'));
for (const [name, size] of [
  ['apple-touch-icon.png', 180],
  ['icon-192.png', 192],
  ['icon-512.png', 512],
]) {
  await sharp(favicon, { density: 600 })
    .resize(size, size)
    .flatten({ background: BIO })
    .png()
    .toFile(join(OUT, name));
  console.log(`✓ public/${name}`);
}

// Generates the theme-aware SVG assets used by README.md.
// Zero dependencies: `node scripts/build.mjs`
//
// GitHub renders README images through <img>, so the SVGs can't load fonts or
// external resources — everything here uses system font stacks and inline
// styles only.
//
// Theme switching works two ways, and the split is forced by GitHub:
// - Desktop tier: a light/dark PAIR, picked with <picture> +
//   `(prefers-color-scheme: dark)`, which GitHub rewrites to follow its own
//   appearance setting.
// - Tablet/mobile tiers: ONE adaptive file each, with both palettes inside and
//   an `@media (prefers-color-scheme: dark)` of its own. GitHub rewrites any
//   <source media> that mentions `prefers-color-scheme` to an always/never
//   query and DROPS every other condition in it (measured in DevTools:
//   `(prefers-color-scheme: dark) and (min-width: 582px)…` came back as
//   `(prefers-color-scheme: light),(prefers-color-scheme: dark)`), so a width
//   tier can't also be theme-gated in the README. Width-only sources are left
//   untouched, hence: width sources first, then the desktop dark source.

import { mkdirSync, readdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { profile, stats, core, stack, buttons } from '../profile.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'assets');

// ---------------------------------------------------------------------------
// Design tokens — mirrors the `ink` / `paper` / `brand` palette of the site.
// ---------------------------------------------------------------------------
const themes = {
  light: {
    bg: '#fbfbfa',
    card: '#ffffff',
    border: '#d9dade',
    hairline: '#eeeef1',
    grid: 'rgba(14,15,20,0.06)',
    text: '#0e0f14',
    text2: '#474853',
    text3: '#70717e',
    muted: '#8f909c',
    brand: '#2542f5',
    accent: '#3b63ff',
    glow: 0.16,
    chipBg: '#ffffff',
    chipBorder: '#d9dade',
    chipText: '#2c2d35',
    chipCoreBg: '#eef2ff',
    chipCoreBorder: '#c7d2fe',
    chipCoreText: '#1e2f9e',
    chipCoreMeta: '#5b6bd6',
    chipMutedBg: '#f7f7f8',
    chipMutedBorder: '#c9cad0',
    chipMutedText: '#70717e',
    pillBg: '#f0fdf4',
    pillBorder: '#bbf7d0',
    pillText: '#166534',
    btnBg: '#ffffff',
    btnBorder: '#d9dade',
    btnText: '#1a1b22',
    btnPrimaryBg: '#2542f5',
    btnPrimaryText: '#ffffff',
  },
  dark: {
    bg: '#0e0f14',
    card: '#13141b',
    border: '#2c2d35',
    hairline: '#1f2028',
    grid: 'rgba(255,255,255,0.05)',
    text: '#f7f7f8',
    text2: '#b7b8c0',
    text3: '#8f909c',
    muted: '#70717e',
    brand: '#93b3ff',
    accent: '#3b63ff',
    glow: 0.28,
    chipBg: '#13141b',
    chipBorder: '#2c2d35',
    chipText: '#eeeef1',
    chipCoreBg: 'rgba(59,99,255,0.14)',
    chipCoreBorder: 'rgba(147,179,255,0.38)',
    chipCoreText: '#dbe4ff',
    chipCoreMeta: '#93b3ff',
    chipMutedBg: 'rgba(255,255,255,0.02)',
    chipMutedBorder: '#33343d',
    chipMutedText: '#8f909c',
    pillBg: 'rgba(34,197,94,0.10)',
    pillBorder: 'rgba(34,197,94,0.35)',
    pillText: '#86efac',
    btnBg: '#13141b',
    btnBorder: '#2c2d35',
    btnText: '#f7f7f8',
    btnPrimaryBg: '#3b63ff',
    btnPrimaryText: '#ffffff',
  },
};

// ---------------------------------------------------------------------------
// Adaptive tokens — one file that follows the viewer's colour scheme.
//
// Every token becomes `var(--token)`; the light values live on `:root` and the
// dark ones under `@media (prefers-color-scheme: dark)`, inside the SVG. That
// is the OS scheme, not GitHub's setting: they agree for the default "sync
// with system", and Safari/iOS still ignore it in SVG-as-image (Interop 2026),
// where the light palette is what shows. Presentation attributes can't take
// var(), so `adaptiveSvg` moves those into a style attribute after rendering.
// ---------------------------------------------------------------------------
const TOKENS = Object.keys(themes.light);
const adaptive = Object.fromEntries(TOKENS.map((k) => [k, `var(--${k})`]));
const ADAPTIVE_STYLE =
  `:root{${TOKENS.map((k) => `--${k}:${themes.light[k]}`).join(';')}}` +
  `@media (prefers-color-scheme: dark){:root{${TOKENS.map((k) => `--${k}:${themes.dark[k]}`).join(';')}}}`;

const VAR_ATTRS = /\s+(fill|stroke|stop-color|stop-opacity)="(var\(--[\w-]+\))"/g;

function adaptiveSvg(markup) {
  const moved = markup.replace(/<(\w[\w-]*)((?:\s+[\w:-]+="[^"]*")*)\s*(\/?)>/g, (tagMarkup, tag, attrs, close) => {
    const decl = [];
    const rest = attrs.replace(VAR_ATTRS, (_, prop, val) => {
      decl.push(`${prop}:${val}`);
      return '';
    });
    if (decl.length === 0) return tagMarkup;
    const style = decl.join(';');
    const merged = /\sstyle="/.test(rest)
      ? rest.replace(/\sstyle="([^"]*)"/, (_, s) => ` style="${s.replace(/;?\s*$/, '')};${style}"`)
      : `${rest} style="${style}"`;
    return `<${tag}${merged}${close ? ' /' : ''}>`;
  });
  return moved.replace('<defs>', `<defs><style>${ADAPTIVE_STYLE}</style>`);
}

// The hero console is dark in both themes, like the one on the site.
const console_ = {
  bg: '#0b0c10',
  border: 'rgba(255,255,255,0.10)',
  comment: '#70717e',
  kw: '#93b3ff',
  fn: '#eeeef1',
  key: '#b7b8c0',
  str: '#86efac',
  num: '#fbbf24',
  punct: '#8f909c',
};

const SANS = "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
const MONO = "ui-monospace, 'Cascadia Code', 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace";
const SIGNAL = '#22c55e';

// ---------------------------------------------------------------------------
// Text measurement. We can't load fonts, so widths are estimated from a
// per-glyph table (Inter-like metrics) and then pinned with `textLength` so
// the layout holds whatever system font the viewer has.
// ---------------------------------------------------------------------------
const LOWER = { i: .25, j: .27, l: .25, t: .34, f: .34, r: .36, s: .48, c: .52, a: .54, e: .56, o: .58, n: .58, u: .58, v: .52, x: .52, z: .5, y: .53, k: .53, g: .58, d: .6, b: .6, p: .6, q: .6, h: .58, m: .88, w: .8 };
const UPPER = { I: .28, J: .5, L: .52, F: .56, E: .58, T: .58, P: .62, S: .62, Z: .6, B: .64, R: .64, K: .64, A: .68, V: .68, X: .66, Y: .64, C: .7, D: .72, N: .74, H: .74, U: .72, G: .74, O: .78, Q: .78, M: .9, W: .98 };
const OTHER = { ' ': .28, '.': .27, ',': .27, ':': .27, ';': .27, '·': .3, '-': .33, '‑': .33, '–': .56, '—': .9, '/': .4, '(': .33, ')': .33, '&': .68, '+': .58, '_': .5, "'": .22, '"': .4, '#': .6, '@': .9, '!': .28, '?': .5 };

function measure(text, size, { mono = false, tracking = 0 } = {}) {
  let w = 0;
  for (const ch of text) {
    if (mono) w += 0.6;
    else if (LOWER[ch] != null) w += LOWER[ch];
    else if (UPPER[ch] != null) w += UPPER[ch];
    else if (OTHER[ch] != null) w += OTHER[ch];
    else if (/\d/.test(ch)) w += 0.58;
    else w += 0.6;
  }
  return Math.round((w * size + tracking * Math.max(0, text.length - 1)) * 10) / 10;
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function text(x, y, str, { size = 15, weight = 400, fill, family = SANS, tracking, anchor, fit, extra = '' } = {}) {
  const attrs = [
    `x="${x}"`,
    `y="${y}"`,
    `font-family="${family}"`,
    `font-size="${size}"`,
    `font-weight="${weight}"`,
    fill ? `fill="${fill}"` : '',
    tracking != null ? `letter-spacing="${tracking}"` : '',
    anchor ? `text-anchor="${anchor}"` : '',
    fit ? `textLength="${fit}" lengthAdjust="spacingAndGlyphs"` : '',
    extra,
  ].filter(Boolean).join(' ');
  return `<text ${attrs}>${esc(str)}</text>`;
}

function svg({ w, h, title, body, defs = '', style = '' }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(title)}">
<title>${esc(title)}</title>
<defs>${defs}${style ? `<style>${style}</style>` : ''}</defs>
${body}
</svg>
`;
}

// ---------------------------------------------------------------------------
// Hero — shared pieces
// ---------------------------------------------------------------------------
const HERO_STYLE = `
  .caret { animation: blink 1.1s steps(1) infinite }
  @keyframes blink { 50% { opacity: 0 } }
  @media (prefers-reduced-motion: reduce) { .caret { animation: none } }`;

const heroTitle = () => `${profile.name} — ${profile.eyebrow} · ${profile.focus}. ${profile.tagline.join(' ')}`;

const heroDefs = (t, W, H, R) => `
  <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse"><path d="M32 0H0V32" fill="none" stroke="${t.grid}" stroke-width="1"/></pattern>
  <radialGradient id="glow" cx="0.78" cy="0.35" r="0.55"><stop offset="0" stop-color="${t.accent}" stop-opacity="${t.glow}"/><stop offset="1" stop-color="${t.accent}" stop-opacity="0"/></radialGradient>
  <linearGradient id="mono" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3b63ff"/><stop offset="1" stop-color="#1d2cb2"/></linearGradient>
  <clipPath id="clip"><rect width="${W}" height="${H}" rx="${R}"/></clipPath>`;

// Card surface: paper/ink background, 32px grid, brand glow, hairline border.
const heroSurface = (t, W, H, R) => `<g clip-path="url(#clip)">
  <rect width="${W}" height="${H}" fill="${t.bg}"/>
  <rect width="${W}" height="${H}" fill="url(#grid)"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
</g>
<rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="${R}" fill="none" stroke="${t.border}"/>`;

// Availability dot with an expanding ring (SMIL, so it needs no transform-box support).
const pulseDot = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${SIGNAL}"/>
<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${SIGNAL}" stroke-width="1.5" opacity="0.6">
  <animate attributeName="r" values="${r};${r * 3}" dur="2.2s" repeatCount="indefinite"/>
  <animate attributeName="opacity" values="0.6;0" dur="2.2s" repeatCount="indefinite"/>
</circle>`;

// Hero console — the agent-ready nod to the site's own hero.
function consoleCard({ x: cx, y: cy, w: cw, pad = 20, mono = 13, lh = 22 }) {
  const C = console_;
  const head = 38;
  const ch = head + pad + 4 + 6 * lh + pad + 10;
  const parts = [];
  parts.push(`<rect x="${cx}" y="${cy}" width="${cw}" height="${ch}" rx="16" fill="${C.bg}" stroke="${C.border}"/>`);
  parts.push(`<circle cx="${cx + 20}" cy="${cy + 19}" r="5" fill="#ff5f57"/><circle cx="${cx + 38}" cy="${cy + 19}" r="5" fill="#febc2e"/><circle cx="${cx + 56}" cy="${cy + 19}" r="5" fill="#28c840"/>`);
  parts.push(text(cx + 78, cy + 23, `${profile.site} · agent-ready`, { size: Math.min(11.5, mono - 1), weight: 500, fill: C.comment, family: MONO }));
  parts.push(`<line x1="${cx}" y1="${cy + head}" x2="${cx + cw}" y2="${cy + head}" stroke="${C.border}"/>`);

  const line = (n, spans) => {
    const y = cy + head + pad + 4 + n * lh;
    const inner = spans.map(([s, color]) => `<tspan fill="${color}">${esc(s)}</tspan>`).join('');
    return `<text x="${cx + pad}" y="${y}" font-family="${MONO}" font-size="${mono}" xml:space="preserve">${inner}</text>`;
  };
  parts.push(line(0, [['// navigator.modelContext · 18 tools', C.comment]]));
  parts.push(line(1, [['await ', C.kw], ['oscarResume', C.fn], ['.call(', C.punct], ["'get_profile'", C.str], [')', C.punct]]));
  parts.push(line(2, [['{', C.punct]]));
  parts.push(line(3, [['  name:  ', C.key], ['"Oscar Arenas"', C.str], [',', C.punct]]));
  parts.push(line(4, [['  years: ', C.key], ['14', C.num], [',', C.punct]]));
  parts.push(line(5, [['  stack: ', C.key], ['[', C.punct], ['"Next.js"', C.str], [', ', C.punct], ['"Node"', C.str], [', ', C.punct], ['"TS"', C.str], [', ', C.punct], ['"AI"', C.str], [']', C.punct]]));
  parts.push(line(6, [['}', C.punct]]));
  const caretY = cy + head + pad + 4 + 6 * lh - Math.round(mono * 0.92);
  parts.push(`<rect class="caret" x="${cx + pad + mono * 0.6 + 4}" y="${caretY}" width="${Math.round(mono * 0.58 * 10) / 10}" height="${Math.round(mono * 1.23)}" rx="1" fill="${C.kw}"/>`);
  return { parts, h: ch };
}

// ---------------------------------------------------------------------------
// Hero (desktop)
// ---------------------------------------------------------------------------
function hero(t) {
  const W = 1000, H = 400, R = 24;
  const parts = [];
  parts.push(heroSurface(t, W, H, R));

  // Monogram
  parts.push(`<rect x="48" y="44" width="60" height="60" rx="15" fill="url(#mono)"/>`);
  parts.push(text(78, 83, profile.monogram, { size: 26, weight: 800, fill: '#ffffff', anchor: 'middle', tracking: -0.5 }));

  // Availability pill (top-right), with a pulsing dot
  const pillFont = 14;
  const pillTextW = measure(profile.availability, pillFont, { tracking: 0.1 });
  const pillW = 14 + 8 + 10 + pillTextW + 16;
  const pillX = W - 48 - pillW, pillY = 56, pillH = 34;
  parts.push(`<rect x="${pillX}" y="${pillY}" width="${pillW}" height="${pillH}" rx="17" fill="${t.pillBg}" stroke="${t.pillBorder}"/>`);
  parts.push(pulseDot(pillX + 14 + 4, pillY + pillH / 2, 4));
  parts.push(text(pillX + 14 + 8 + 10, pillY + 22, profile.availability, { size: pillFont, weight: 600, fill: t.pillText, tracking: 0.1, fit: pillTextW }));

  // Type stack
  parts.push(text(48, 150, profile.eyebrow.toUpperCase(), { size: 13, weight: 600, fill: t.text3, family: MONO, tracking: 2.2 }));
  parts.push(text(45, 212, profile.name, { size: 64, weight: 800, fill: t.text, tracking: -2.2 }));
  parts.push(text(48, 250, profile.focus, { size: 22, weight: 600, fill: t.brand, tracking: -0.2 }));
  parts.push(text(48, 290, profile.tagline[0], { size: 18, weight: 400, fill: t.text2 }));
  parts.push(text(48, 316, profile.tagline[1], { size: 18, weight: 400, fill: t.text2 }));

  // Meta line: pin icon + location + remote
  parts.push(`<path transform="translate(48,350)" d="M7 0a5 5 0 0 0-5 5c0 3.6 5 9 5 9s5-5.4 5-9a5 5 0 0 0-5-5zm0 7a2 2 0 1 1 0-4 2 2 0 0 1 0 4z" fill="${t.muted}"/>`);
  parts.push(text(68, 362, `${profile.location}   ·   ${profile.remote}`, { size: 14.5, weight: 500, fill: t.text3, tracking: 0.1 }));

  // Console card (right)
  parts.push(...consoleCard({ x: W - 48 - 360, y: 108, w: 360 }).parts);

  return svg({ w: W, h: H, title: heroTitle(), body: parts.join('\n'), defs: heroDefs(t, W, H, R), style: HERO_STYLE });
}

// ---------------------------------------------------------------------------
// Hero (stacked) — mobile and tablet columns. Same ingredients, one column;
// `s` scales type and spacing (1 = phone, ~1.2 = tablet).
// ---------------------------------------------------------------------------
function heroStacked(t, { W, s = 1 }) {
  const R = 20, px = Math.round(28 * s);
  const parts = [];
  const r = (v) => Math.round(v * s * 10) / 10;

  // Top row: monogram + availability pill
  const mono = r(48);
  parts.push(`<rect x="${px}" y="${px}" width="${mono}" height="${mono}" rx="${r(12)}" fill="url(#mono)"/>`);
  parts.push(text(px + mono / 2, px + r(32), profile.monogram, { size: r(21), weight: 800, fill: '#ffffff', anchor: 'middle', tracking: -0.4 }));
  const pillFont = r(12);
  const pillTextW = measure(profile.availability, pillFont, { tracking: 0.1 });
  const pillW = r(12) + r(8) + r(8) + pillTextW + r(14);
  const pillH = r(30), pillX = W - px - pillW, pillY = px + r(9);
  parts.push(`<rect x="${pillX}" y="${pillY}" width="${pillW}" height="${pillH}" rx="${pillH / 2}" fill="${t.pillBg}" stroke="${t.pillBorder}"/>`);
  parts.push(pulseDot(pillX + r(12) + r(4), pillY + pillH / 2, r(3.5)));
  parts.push(text(pillX + r(12) + r(8) + r(8), pillY + r(19.5), profile.availability, { size: pillFont, weight: 600, fill: t.pillText, tracking: 0.1, fit: pillTextW }));

  // Type stack
  parts.push(text(px, r(114), profile.eyebrow.toUpperCase(), { size: r(11), weight: 600, fill: t.text3, family: MONO, tracking: r(1.8) }));
  parts.push(text(px - 2, r(158), profile.name, { size: r(44), weight: 800, fill: t.text, tracking: r(-1.5) }));
  parts.push(text(px, r(188), profile.focus, { size: r(16), weight: 600, fill: t.brand, tracking: -0.1 }));
  profile.taglineMobile.forEach((l, i) => parts.push(text(px, r(218 + i * 21), l, { size: r(14.5), weight: 400, fill: t.text2 })));

  // Meta line
  parts.push(`<path transform="translate(${px},${r(284)}) scale(${r(0.86)})" d="M7 0a5 5 0 0 0-5 5c0 3.6 5 9 5 9s5-5.4 5-9a5 5 0 0 0-5-5zm0 7a2 2 0 1 1 0-4 2 2 0 0 1 0 4z" fill="${t.muted}"/>`);
  parts.push(text(px + r(18), r(295), `${profile.location}  ·  ${profile.remoteShort}`, { size: r(12.5), weight: 500, fill: t.text3, tracking: 0.1 }));

  // Console, full width
  const con = consoleCard({ x: px, y: r(318), w: W - px * 2, pad: r(16), mono: r(11.5), lh: r(19) });
  parts.push(...con.parts);

  const H = Math.round(r(318) + con.h + px);
  return svg({ w: W, h: H, title: heroTitle(), body: heroSurface(t, W, H, R) + '\n' + parts.join('\n'), defs: heroDefs(t, W, H, R), style: HERO_STYLE });
}

// ---------------------------------------------------------------------------
// Stats strip
// ---------------------------------------------------------------------------
function statsStrip(t, { W = 1000, cols = 4, gap = 20, short = false } = {}) {
  const n = stats.length, pad = short ? 18 : 22, rowH = short ? 150 : 168, rows = Math.ceil(n / cols);
  const cw = (W - gap * (cols - 1)) / cols;
  const parts = [];
  stats.forEach((s, i) => {
    const x = (i % cols) * (cw + gap);
    const y = Math.floor(i / cols) * (rowH + gap);
    parts.push(`<rect x="${x + 0.5}" y="${y + 0.5}" width="${cw - 1}" height="${rowH - 1}" rx="16" fill="${t.card}" stroke="${t.border}"/>`);
    const ey = short ? 34 : 38;
    parts.push(text(x + pad, y + ey, String(i + 1).padStart(2, '0'), { size: 12, weight: 600, fill: t.brand, family: MONO, tracking: 2 }));
    parts.push(`<line x1="${x + pad + 28}" y1="${y + ey - 4.5}" x2="${x + cw - pad}" y2="${y + ey - 4.5}" stroke="${t.hairline}"/>`);
    parts.push(text(x + pad - 2, y + (short ? 88 : 98), s.value, { size: short ? 38 : 42, weight: 800, fill: t.text, tracking: -1.5 }));
    const inner = cw - pad * 2;
    const lines = (short && s.linesShort) || s.lines;
    lines.forEach((l, j) => {
      let size = short ? 13.5 : 14.5;
      while (measure(l, size) > inner && size > 11.5) size -= 0.5; // auto-fit long labels
      parts.push(text(x + pad, y + (short ? 114 : 126) + j * (short ? 18 : 19), l, { size, weight: 500, fill: t.text2 }));
    });
  });
  const H = rows * rowH + (rows - 1) * gap;
  const title = stats.map((s) => `${s.value} ${s.lines.join(' ')}`).join(' · ');
  return svg({ w: W, h: H, title, body: parts.join('\n') });
}

// ---------------------------------------------------------------------------
// Stack — one card: a highlighted "core" row (with hands-on years), then
// category rows of wrapped chips. Three chip variants carry the hierarchy:
//   core   — brand-tinted, name + years in mono
//   default— paper chip
//   muted  — dashed hairline, low contrast (the `legacy` groups)
// ---------------------------------------------------------------------------
// `labelCol` = width of the side label column; 0 puts the label above the chips.
function stackBoard(t, { W = 1000, labelCol = 196, font = 15 } = {}) {
  const chipH = Math.round(font * 2.27), padX = Math.round(font * 0.87), gapX = 9, gapY = 9, padY = 18;
  const px = labelCol ? 24 : 18; // card inset
  const inner = W - px * 2;
  const metaFont = Math.round(font * 0.78 * 10) / 10;
  const parts = [];

  // One chip. Returns its width so the caller can flow the row.
  const chip = (x, y, item, variant) => {
    const baseY = y + Math.round(chipH / 2 + font * 0.33);
    if (variant === 'core') {
      const tw = measure(item.name, font), mw = measure(item.meta, metaFont, { mono: true });
      const gap = Math.round(font * 0.55);
      const w = Math.round(padX * 2 + tw + gap + mw);
      return {
        w,
        markup: [
          `<rect x="${x + 0.5}" y="${y + 0.5}" width="${w - 1}" height="${chipH - 1}" rx="9" fill="${t.chipCoreBg}" stroke="${t.chipCoreBorder}"/>`,
          text(x + padX, baseY, item.name, { size: font, weight: 600, fill: t.chipCoreText, fit: tw }),
          text(x + padX + tw + gap, baseY - 0.5, item.meta, { size: metaFont, weight: 500, fill: t.chipCoreMeta, family: MONO, fit: mw }),
        ].join('\n'),
      };
    }
    const tw = measure(item, font);
    const w = Math.round(padX * 2 + tw);
    const muted = variant === 'muted';
    return {
      w,
      markup: [
        `<rect x="${x + 0.5}" y="${y + 0.5}" width="${w - 1}" height="${chipH - 1}" rx="9" fill="${muted ? t.chipMutedBg : t.chipBg}" stroke="${muted ? t.chipMutedBorder : t.chipBorder}"${muted ? ' stroke-dasharray="4 3"' : ''}/>`,
        text(x + padX, baseY, item, { size: font, weight: 500, fill: muted ? t.chipMutedText : t.chipText, fit: tw }),
      ].join('\n'),
    };
  };

  // Wrap chips into lines, `text-wrap: balance` style: keep the line count the
  // greedy wrap needs, but pick the breaks that minimise squared trailing space,
  // so a row reads 5 + 4 instead of 8 + 1 and narrow tiers don't go ragged.
  const flow = (widths, avail) => {
    const n = widths.length;
    const lineW = (a, b) => widths.slice(a, b).reduce((s, w) => s + w, 0) + gapX * (b - a - 1);
    let greedy = 1;
    for (let i = 0, cx = 0; i < n; i++) {
      if (cx > 0 && cx + widths[i] > avail) { greedy++; cx = 0; }
      cx += widths[i] + gapX;
    }
    // dp[k][i]: best cost laying out the first i chips on k lines; prev[k][i] = break before line k.
    const dp = Array.from({ length: greedy + 1 }, () => Array(n + 1).fill(Infinity));
    const prev = Array.from({ length: greedy + 1 }, () => Array(n + 1).fill(-1));
    dp[0][0] = 0;
    for (let k = 1; k <= greedy; k++) {
      for (let i = 1; i <= n; i++) {
        for (let j = k - 1; j < i; j++) {
          if (dp[k - 1][j] === Infinity) continue;
          const slack = avail - lineW(j, i);
          if (slack < 0 && i - j > 1) continue; // overflow is only tolerated for a chip wider than the row
          const cost = dp[k - 1][j] + Math.max(0, slack) ** 2;
          if (cost < dp[k][i]) { dp[k][i] = cost; prev[k][i] = j; }
        }
      }
    }
    const lines = [];
    for (let k = greedy, i = n; k > 0; k--) {
      const j = prev[k][i];
      lines.unshift(Array.from({ length: i - j }, (_, m) => j + m));
      i = j;
    }
    return lines;
  };

  // One labelled row: dot + mono label, chips flowing to the right (or below).
  const row = (y, { label, color, items, variant }) => {
    const labelY = labelCol ? y + chipH / 2 : y + 8;
    parts.push(`<circle cx="${px + 5}" cy="${labelY}" r="4" fill="${color}"/>`);
    parts.push(text(px + 18, labelY + 4.5, label.toUpperCase(), { size: 12, weight: 600, fill: t.text3, family: MONO, tracking: 1.6 }));
    if (!labelCol) y += 26;

    const widths = items.map((item) => chip(0, 0, item, variant).w);
    const avail = inner - labelCol;
    const lines = flow(widths, avail);
    lines.forEach((line, li) => {
      let cx = px + labelCol;
      const cy = y + li * (chipH + gapY);
      for (const i of line) {
        parts.push(chip(cx, cy, items[i], variant).markup);
        cx += widths[i] + gapX;
      }
    });
    return y + lines.length * (chipH + gapY) - gapY;
  };

  let y = padY + 2;
  // Core row — brand accent, then a full-strength divider to set it apart.
  y = row(y, { label: 'Core stack', color: t.accent, items: core, variant: 'core' }) + padY;
  parts.push(`<line x1="${px}" y1="${y + 0.5}" x2="${W - px}" y2="${y + 0.5}" stroke="${t.border}"/>`);

  stack.forEach((group, gi) => {
    if (gi > 0) parts.push(`<line x1="${px}" y1="${y + 0.5}" x2="${W - px}" y2="${y + 0.5}" stroke="${t.hairline}"/>`);
    y = row(y + padY, { label: group.label, color: group.color, items: group.items, variant: group.legacy ? 'muted' : 'default' }) + padY;
  });

  const H = y + 2;
  const card = `<rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="16" fill="${t.card}" stroke="${t.border}"/>`;
  const title =
    `Core stack: ${core.map((c) => `${c.name} (${c.meta})`).join(', ')}. ` +
    stack.map((g) => `${g.label}: ${g.items.join(', ')}`).join('. ');
  return svg({ w: W, h: H, title, body: card + '\n' + parts.join('\n') });
}

// ---------------------------------------------------------------------------
// Buttons
// ---------------------------------------------------------------------------
const ICONS = {
  arrow: (c) => `<path d="M4 12 12 4M6 4h6v6" fill="none" stroke="${c}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`,
  download: (c) => `<path d="M8 2v8m-3.5-3.5L8 10l3.5-3.5M3 13.5h10" fill="none" stroke="${c}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`,
  mail: (c) => `<path d="M2.5 4.5h11v7h-11z" fill="none" stroke="${c}" stroke-width="1.6" stroke-linejoin="round"/><path d="m2.5 5 5.5 4 5.5-4" fill="none" stroke="${c}" stroke-width="1.6" stroke-linejoin="round"/>`,
  linkedin: (c) => `<g transform="scale(0.6667)"><path fill="${c}" d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></g>`,
};

function button(t, b) {
  const h = 40, font = 15, padL = 16, padR = 18, icon = 16, gap = 9;
  const primary = b.variant === 'primary';
  const fg = primary ? t.btnPrimaryText : t.btnText;
  const tw = measure(b.label, font, { tracking: 0.1 });
  const w = Math.round(padL + icon + gap + tw + padR);
  const body = [
    primary
      ? `<rect width="${w}" height="${h}" rx="10" fill="${t.btnPrimaryBg}"/>`
      : `<rect x="0.5" y="0.5" width="${w - 1}" height="${h - 1}" rx="10" fill="${t.btnBg}" stroke="${t.btnBorder}"/>`,
    `<g transform="translate(${padL},${(h - icon) / 2})">${ICONS[b.icon](fg)}</g>`,
    text(padL + icon + gap, 25, b.label, { size: font, weight: 600, fill: fg, tracking: 0.1, fit: tw }),
  ].join('\n');
  return svg({ w, h, title: b.label, body });
}

// ---------------------------------------------------------------------------
mkdirSync(OUT, { recursive: true });
const files = {};
// Three tiers keyed to the README column width GitHub gives us:
// desktop ~700-832px, tablet ~500-730px, mobile ~335-500px.
for (const [name, t] of Object.entries(themes)) {
  // Desktop tier and buttons: a light/dark pair, switched by GitHub's theme.
  files[`hero-${name}.svg`] = hero(t);
  files[`stats-${name}.svg`] = statsStrip(t);
  files[`stack-${name}.svg`] = stackBoard(t);
  for (const b of buttons) files[`btn-${b.id}-${name}.svg`] = button(t, b);
}
// Narrow tiers: one adaptive file each, picked by width alone in the README.
files['hero-tablet.svg'] = adaptiveSvg(heroStacked(adaptive, { W: 640, s: 1.2 }));
files['hero-mobile.svg'] = adaptiveSvg(heroStacked(adaptive, { W: 400 }));
files['stats-tablet.svg'] = adaptiveSvg(statsStrip(adaptive, { W: 640, cols: 2 }));
files['stats-mobile.svg'] = adaptiveSvg(statsStrip(adaptive, { W: 400, cols: 2, gap: 16, short: true }));
files['stack-tablet.svg'] = adaptiveSvg(stackBoard(adaptive, { W: 640, labelCol: 0 }));
files['stack-mobile.svg'] = adaptiveSvg(stackBoard(adaptive, { W: 400, labelCol: 0, font: 14 }));

const written = [];
for (const [file, content] of Object.entries(files)) {
  if (/var\(--[\w-]+\)"/.test(content.replace(/<style>[\s\S]*?<\/style>/g, '').replace(/style="[^"]*"/g, ''))) {
    throw new Error(`${file}: a var() is left in a presentation attribute, where browsers ignore it`);
  }
  writeFileSync(join(OUT, file), content);
  written.push(`${file} (${(content.length / 1024).toFixed(1)} kB)`);
}
// Stale outputs from an older naming (e.g. the per-theme narrow tiers) would
// keep working by accident until the README stopped pointing at them.
for (const stale of readdirSync(OUT).filter((f) => f.endsWith('.svg') && !(f in files))) {
  unlinkSync(join(OUT, stale));
  written.push(`${stale} (removed: no longer generated)`);
}
console.log(written.join('\n'));

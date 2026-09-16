// Generates the theme-aware SVG assets used by README.md.
// Zero dependencies: `node scripts/build.mjs`
//
// GitHub renders README images through <img>, so the SVGs can't load fonts or
// external resources — everything here uses system font stacks and inline
// styles only. Light/dark variants are picked with <picture> in the README.

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { profile, stats, stack, buttons } from '../profile.mjs';

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
// Hero
// ---------------------------------------------------------------------------
function hero(t) {
  const W = 1200, H = 420, R = 24;
  const defs = `
  <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse"><path d="M32 0H0V32" fill="none" stroke="${t.grid}" stroke-width="1"/></pattern>
  <radialGradient id="glow" cx="0.78" cy="0.35" r="0.55"><stop offset="0" stop-color="${t.accent}" stop-opacity="${t.glow}"/><stop offset="1" stop-color="${t.accent}" stop-opacity="0"/></radialGradient>
  <linearGradient id="mono" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3b63ff"/><stop offset="1" stop-color="#1d2cb2"/></linearGradient>
  <clipPath id="clip"><rect width="${W}" height="${H}" rx="${R}"/></clipPath>`;
  const style = `
  .caret { animation: blink 1.1s steps(1) infinite }
  @keyframes blink { 50% { opacity: 0 } }
  @media (prefers-reduced-motion: reduce) { .caret { animation: none } }`;

  const parts = [];
  // Surface
  parts.push(`<g clip-path="url(#clip)">
  <rect width="${W}" height="${H}" fill="${t.bg}"/>
  <rect width="${W}" height="${H}" fill="url(#grid)"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
</g>
<rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="${R}" fill="none" stroke="${t.border}"/>`);

  // Monogram
  parts.push(`<rect x="56" y="48" width="64" height="64" rx="16" fill="url(#mono)"/>`);
  parts.push(text(88, 90, profile.monogram, { size: 28, weight: 800, fill: '#ffffff', anchor: 'middle', tracking: -0.5 }));

  // Availability pill (top-right), with a pulsing dot
  const pillFont = 14;
  const pillTextW = measure(profile.availability, pillFont, { tracking: 0.1 });
  const pillW = 14 + 8 + 10 + pillTextW + 16;
  const pillX = W - 56 - pillW, pillY = 60, pillH = 36;
  parts.push(`<rect x="${pillX}" y="${pillY}" width="${pillW}" height="${pillH}" rx="18" fill="${t.pillBg}" stroke="${t.pillBorder}"/>`);
  const dotX = pillX + 14 + 4, dotY = pillY + pillH / 2;
  parts.push(`<circle cx="${dotX}" cy="${dotY}" r="4" fill="${SIGNAL}"/>
<circle cx="${dotX}" cy="${dotY}" r="4" fill="none" stroke="${SIGNAL}" stroke-width="1.5" opacity="0.6">
  <animate attributeName="r" values="4;12" dur="2.2s" repeatCount="indefinite"/>
  <animate attributeName="opacity" values="0.6;0" dur="2.2s" repeatCount="indefinite"/>
</circle>`);
  parts.push(text(pillX + 14 + 8 + 10, pillY + 23, profile.availability, { size: pillFont, weight: 600, fill: t.pillText, tracking: 0.1, fit: pillTextW }));

  // Type stack
  parts.push(text(56, 160, profile.eyebrow.toUpperCase(), { size: 13, weight: 600, fill: t.text3, family: MONO, tracking: 2.2 }));
  parts.push(text(53, 226, profile.name, { size: 72, weight: 800, fill: t.text, tracking: -2.5 }));
  parts.push(text(56, 268, profile.focus, { size: 24, weight: 600, fill: t.brand, tracking: -0.2 }));
  parts.push(text(56, 310, profile.tagline[0], { size: 19, weight: 400, fill: t.text2 }));
  parts.push(text(56, 338, profile.tagline[1], { size: 19, weight: 400, fill: t.text2 }));

  // Meta line: pin icon + location + remote
  parts.push(`<path transform="translate(56,372)" d="M7 0a5 5 0 0 0-5 5c0 3.6 5 9 5 9s5-5.4 5-9a5 5 0 0 0-5-5zm0 7a2 2 0 1 1 0-4 2 2 0 0 1 0 4z" fill="${t.muted}"/>`);
  parts.push(text(76, 384, `${profile.location}   ·   ${profile.remote}`, { size: 14, weight: 500, fill: t.text3, tracking: 0.1 }));

  // Console card (right)
  const cx = 744, cy = 112, cw = 400, ch = 256, pad = 24, mono = 14, lh = 24;
  parts.push(`<rect x="${cx}" y="${cy}" width="${cw}" height="${ch}" rx="16" fill="${console_.bg}" stroke="${console_.border}"/>`);
  parts.push(`<circle cx="${cx + 24}" cy="${cy + 20}" r="5" fill="#ff5f57"/><circle cx="${cx + 42}" cy="${cy + 20}" r="5" fill="#febc2e"/><circle cx="${cx + 60}" cy="${cy + 20}" r="5" fill="#28c840"/>`);
  parts.push(text(cx + 84, cy + 24, `${profile.site} · agent-ready`, { size: 12, weight: 500, fill: console_.comment, family: MONO }));
  parts.push(`<line x1="${cx}" y1="${cy + 40}" x2="${cx + cw}" y2="${cy + 40}" stroke="${console_.border}"/>`);

  const line = (n, spans) => {
    const y = cy + 40 + pad + 4 + n * lh;
    const inner = spans.map(([s, color]) => `<tspan fill="${color}">${esc(s)}</tspan>`).join('');
    return `<text x="${cx + pad}" y="${y}" font-family="${MONO}" font-size="${mono}" xml:space="preserve">${inner}</text>`;
  };
  const C = console_;
  parts.push(line(0, [['// navigator.modelContext · 18 tools', C.comment]]));
  parts.push(line(1, [['await ', C.kw], ['oscarResume', C.fn], ['.call(', C.punct], ["'get_profile'", C.str], [')', C.punct]]));
  parts.push(line(2, [['{', C.punct]]));
  parts.push(line(3, [['  name:  ', C.key], ['"Oscar Arenas"', C.str], [',', C.punct]]));
  parts.push(line(4, [['  years: ', C.key], ['14', C.num], [',', C.punct]]));
  parts.push(line(5, [['  stack: ', C.key], ['[', C.punct], ['"Next.js"', C.str], [', ', C.punct], ['"Node"', C.str], [', ', C.punct], ['"TS"', C.str], [', ', C.punct], ['"AI"', C.str], [']', C.punct]]));
  parts.push(line(6, [['}', C.punct]]));
  const caretY = cy + 40 + pad + 4 + 6 * lh - 13;
  parts.push(`<rect class="caret" x="${cx + pad + mono * 0.6 + 4}" y="${caretY}" width="8" height="17" rx="1" fill="${C.kw}"/>`);

  return svg({ w: W, h: H, title: `${profile.name} — ${profile.eyebrow} · ${profile.focus}. ${profile.tagline.join(' ')}`, body: parts.join('\n'), defs, style });
}

// ---------------------------------------------------------------------------
// Stats strip
// ---------------------------------------------------------------------------
function statsStrip(t) {
  const W = 1200, H = 176, gap = 24, n = stats.length;
  const cw = (W - gap * (n - 1)) / n;
  const parts = [];
  stats.forEach((s, i) => {
    const x = i * (cw + gap);
    parts.push(`<rect x="${x + 0.5}" y="0.5" width="${cw - 1}" height="${H - 1}" rx="16" fill="${t.card}" stroke="${t.border}"/>`);
    parts.push(text(x + 24, 40, String(i + 1).padStart(2, '0'), { size: 12, weight: 600, fill: t.brand, family: MONO, tracking: 2 }));
    parts.push(`<line x1="${x + 52}" y1="35.5" x2="${x + cw - 24}" y2="35.5" stroke="${t.hairline}"/>`);
    parts.push(text(x + 22, 104, s.value, { size: 46, weight: 800, fill: t.text, tracking: -1.5 }));
    s.lines.forEach((l, j) => parts.push(text(x + 24, 132 + j * 20, l, { size: 14, weight: 500, fill: t.text2 })));
  });
  const title = stats.map((s) => `${s.value} ${s.lines.join(' ')}`).join(' · ');
  return svg({ w: W, h: H, title, body: parts.join('\n') });
}

// ---------------------------------------------------------------------------
// Stack — category rows with wrapped chips
// ---------------------------------------------------------------------------
function stackBoard(t) {
  const W = 1200, labelCol = 200, chipH = 34, padX = 14, gapX = 10, gapY = 10, font = 15, padY = 20;
  const parts = [];
  let y = 0;
  stack.forEach((group, gi) => {
    if (gi > 0) parts.push(`<line x1="0" y1="${y + 0.5}" x2="${W}" y2="${y + 0.5}" stroke="${t.hairline}"/>`);
    y += padY;
    // label
    parts.push(`<circle cx="5" cy="${y + chipH / 2}" r="4" fill="${group.color}"/>`);
    parts.push(text(18, y + chipH / 2 + 4.5, group.label.toUpperCase(), { size: 12, weight: 600, fill: t.text3, family: MONO, tracking: 2 }));
    // chips
    let cx = labelCol, cy = y;
    for (const item of group.items) {
      const tw = measure(item, font);
      const w = Math.round(padX * 2 + tw);
      if (cx + w > W) { cx = labelCol; cy += chipH + gapY; }
      parts.push(`<rect x="${cx + 0.5}" y="${cy + 0.5}" width="${w - 1}" height="${chipH - 1}" rx="9" fill="${t.chipBg}" stroke="${t.chipBorder}"/>`);
      parts.push(text(cx + padX, cy + 22, item, { size: font, weight: 500, fill: t.chipText, fit: tw }));
      cx += w + gapX;
    }
    y = cy + chipH + padY;
  });
  const H = y;
  const title = stack.map((g) => `${g.label}: ${g.items.join(', ')}`).join('. ');
  return svg({ w: W, h: H, title, body: parts.join('\n') });
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
const written = [];
for (const [name, t] of Object.entries(themes)) {
  const files = {
    [`hero-${name}.svg`]: hero(t),
    [`stats-${name}.svg`]: statsStrip(t),
    [`stack-${name}.svg`]: stackBoard(t),
  };
  for (const b of buttons) files[`btn-${b.id}-${name}.svg`] = button(t, b);
  for (const [file, content] of Object.entries(files)) {
    writeFileSync(join(OUT, file), content);
    written.push(`${file} (${(content.length / 1024).toFixed(1)} kB)`);
  }
}
console.log(written.join('\n'));

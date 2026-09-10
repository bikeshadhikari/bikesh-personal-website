/** Small helpers shared by the site and the dashboard. No server-only imports. */

export function slugify(text: string, fallbackPrefix = 'item'): string {
  const slug = text
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || `${fallbackPrefix}-${Math.random().toString(36).slice(2, 8)}`;
}

export function excerptOf(html: string, words = 32): string {
  const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const parts = text.split(' ');
  return parts.length <= words ? text : `${parts.slice(0, words).join(' ')}…`;
}

export function readingTime(html: string): number {
  const count = html.replace(/<[^>]*>/g, ' ').trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(count / 200));
}

/** Dates are formatted in a fixed timezone so the server and browser agree. */
const TZ = 'Asia/Kathmandu';

export function formatDate(
  value: string | Date | null | undefined,
  opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' },
): string {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-GB', { ...opts, timeZone: TZ }).format(date);
}

export function isoDate(value: string | Date | null | undefined): string {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
}

/** "Jan 2021 — Present" for the experience pipeline. */
export function dateRange(
  start: string | Date | null,
  end: string | Date | null,
  current = false,
): string {
  const opts: Intl.DateTimeFormatOptions = { month: 'short', year: 'numeric' };
  const from = start ? formatDate(start, opts) : '';
  const to = current ? 'Present' : end ? formatDate(end, opts) : '';
  if (from && to) return `${from} — ${to}`;
  return from || to;
}

/** "2 yrs 3 mos" between two dates. */
export function durationBetween(
  start: string | Date | null,
  end: string | Date | null,
  current = false,
): string {
  if (!start) return '';
  const from = start instanceof Date ? start : new Date(start);
  const to = current || !end ? new Date() : end instanceof Date ? end : new Date(end);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || to < from) return '';

  const months =
    (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth()) + 1;
  const years = Math.floor(months / 12);
  const rest = months % 12;
  const parts: string[] = [];
  if (years) parts.push(`${years} yr${years > 1 ? 's' : ''}`);
  if (rest) parts.push(`${rest} mo${rest > 1 ? 's' : ''}`);
  return parts.join(' ');
}

/** Split a one-per-line textarea into clean values. */
export function lines(text: string | null | undefined): string[] {
  if (!text) return [];
  return text.split(/\r\n|\r|\n/).map((l) => l.trim()).filter(Boolean);
}

/** Split a comma separated list into clean values. */
export function csvList(text: string | null | undefined): string[] {
  if (!text) return [];
  return text.split(',').map((v) => v.trim()).filter(Boolean);
}

/**
 * Allow-list sanitiser for post bodies written in the dashboard.
 * Keeps ordinary formatting, removes anything that can execute.
 */
const ALLOWED_TAGS = new Set([
  'p', 'br', 'b', 'strong', 'i', 'em', 'u', 's', 'ul', 'ol', 'li', 'a',
  'h2', 'h3', 'h4', 'h5', 'blockquote', 'pre', 'code', 'img', 'hr',
  'table', 'thead', 'tbody', 'tr', 'th', 'td', 'figure', 'figcaption', 'span', 'div',
]);
const ALLOWED_ATTRS = new Set(['href', 'src', 'alt', 'title', 'colspan', 'rowspan']);

export function sanitizeHtml(input: string): string {
  if (!input) return '';

  // Drop whole elements that can carry script or styling attacks.
  let html = input
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<(script|style|iframe|object|embed|form|input|button|link|meta)\b[\s\S]*?<\/\1\s*>/gi, '')
    .replace(/<(script|style|iframe|object|embed|form|input|button|link|meta)\b[^>]*\/?>/gi, '');

  html = html.replace(/<(\/?)([a-zA-Z0-9]+)((?:\s[^>]*)?)(\/?)>/g, (match, close, tag, attrs, selfClose) => {
    const name = String(tag).toLowerCase();
    if (!ALLOWED_TAGS.has(name)) return '';
    if (close) return `</${name}>`;

    const kept: string[] = [];
    const attrPattern = /([a-zA-Z-]+)\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/g;
    let m: RegExpExecArray | null;
    while ((m = attrPattern.exec(String(attrs))) !== null) {
      const attr = m[1].toLowerCase();
      if (!ALLOWED_ATTRS.has(attr)) continue;
      const value = (m[3] ?? m[4] ?? m[5] ?? '').trim();
      if ((attr === 'href' || attr === 'src') && /^\s*(javascript|data|vbscript):/i.test(value)) {
        continue;
      }
      kept.push(`${attr}="${value.replace(/"/g, '&quot;')}"`);
    }
    const rel = name === 'a' ? ' rel="noopener noreferrer"' : '';
    return `<${name}${kept.length ? ' ' + kept.join(' ') : ''}${rel}${selfClose ? ' /' : ''}>`;
  });

  return html;
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
}

/** Add https:// to a bare domain so links always work. */
export function normalizeUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^(mailto:|tel:|\/)/i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^0-9+]/g, '')}`;
}

/** A CSS colour we are willing to interpolate into a <style> block. */
export function safeColor(value: string, fallback: string): string {
  const trimmed = value.trim();
  return /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(trimmed) ? trimmed : fallback;
}

/** The hue of a hex colour, 0-359. Grey and black land on a usable blue. */
export function hueOf(hex: string): number {
  const raw = hex.replace('#', '');
  const full = raw.length === 3 ? raw.split('').map((c) => c + c).join('') : raw.slice(0, 6);
  const r = parseInt(full.slice(0, 2), 16) / 255;
  const g = parseInt(full.slice(2, 4), 16) / 255;
  const b = parseInt(full.slice(4, 6), 16) / 255;
  if ([r, g, b].some(Number.isNaN)) return 222;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const span = max - min;
  if (span === 0) return 222;

  let h: number;
  if (max === r) h = ((g - b) / span) % 6;
  else if (max === g) h = (b - r) / span + 2;
  else h = (r - g) / span + 4;

  return Math.round(((h * 60) % 360 + 360) % 360);
}

/**
 * Five hues that sit in a pleasant relationship with the chosen accent, used
 * to tint sections, cards and icons so the page reads as a palette rather than
 * one colour repeated. Rotating the accent's own hue means whatever the owner
 * picks in Settings, the rest of the page still agrees with it.
 *
 * Only the hue travels: saturation and lightness are set in the stylesheet, so
 * the same five hues can be bright on a dark background and deep on a light one.
 */
export function toneHues(accent: string): number[] {
  const base = hueOf(accent);
  return [0, 42, 150, 205, 310].map((step) => usableHue((base + step) % 360));
}

/**
 * Hues between roughly 45 and 95 are the olive and mustard band: at the
 * lightness the rest of the ramp uses they read as dirty rather than as a
 * colour. Anything landing there is nudged to the nearest side of it.
 */
function usableHue(h: number): number {
  if (h < 45 || h > 95) return h;
  return h < 70 ? 42 : 100;
}

/**
 * Allow a single map <iframe> and nothing else: no event handlers, no
 * javascript: URLs, and only attributes an embed actually needs.
 */
export function sanitizeEmbed(input: string): string {
  const match = input.match(/<iframe\b[^>]*>/i);
  if (!match) return '';

  const ALLOWED = new Set([
    'src', 'width', 'height', 'title', 'loading', 'allowfullscreen',
    'referrerpolicy', 'frameborder', 'aria-label',
  ]);
  const kept: string[] = [];
  const attrPattern = /([a-zA-Z-]+)(?:\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+)))?/g;

  let attr: RegExpExecArray | null;
  // Skip the tag name itself.
  attrPattern.lastIndex = '<iframe'.length;
  while ((attr = attrPattern.exec(match[0])) !== null) {
    const name = attr[1].toLowerCase();
    if (!ALLOWED.has(name)) continue;
    const value = (attr[3] ?? attr[4] ?? attr[5] ?? '').trim();
    if (name === 'src' && !/^https:\/\//i.test(value)) return '';
    kept.push(value ? `${name}="${value.replace(/"/g, '&quot;')}"` : name);
  }

  if (!kept.some((a) => a.startsWith('src='))) return '';
  return `<iframe ${kept.join(' ')} loading="lazy"></iframe>`;
}

/** JSON safe to place inside a <script> element. */
export function jsonForScript(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');
}

/**
 * The site's public origin, with no trailing slash.
 *
 * Open Graph and sitemap URLs have to be absolute, so this falls back to the
 * address Vercel provides when NEXT_PUBLIC_SITE_URL has not been set. Without
 * the fallback a share preview would point at localhost.
 */
export function siteOrigin(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/+$/, '');

  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  if (vercel) return `https://${vercel.replace(/^https?:\/\//, '').replace(/\/+$/, '')}`;

  return 'http://localhost:3000';
}

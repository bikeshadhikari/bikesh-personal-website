import localFont from 'next/font/local';

/**
 * Self-hosted fonts (SIL Open Font License, files from Fontsource).
 *
 * These used to come from `next/font/google`, which downloads from Google at build
 * time. When Google changed its font-file URLs the download broke every Vercel
 * build, so the files now live in the repo and builds never depend on Google.
 * All files are variable fonts, so every weight is available from one file.
 */

export const sans = localFont({
  src: './plus-jakarta-sans-latin-wght-normal.woff2',
  weight: '200 800',
  variable: '--font-sans-loaded',
  display: 'swap',
});

export const serif = localFont({
  src: './source-serif-4-latin-wght-normal.woff2',
  weight: '200 900',
  variable: '--font-serif-loaded',
  display: 'swap',
});

// Devanagari faces ship as two subsets: Devanagari glyphs and Latin glyphs.
// They become two families, and `devaStack` lists both so the browser picks
// each character from whichever file has it.
const devaSansDeva = localFont({ src: './noto-sans-devanagari-devanagari-wght-normal.woff2', weight: '100 900', display: 'swap' });
const devaSansLatin = localFont({ src: './noto-sans-devanagari-latin-wght-normal.woff2', weight: '100 900', display: 'swap' });
const devaSerifDeva = localFont({ src: './noto-serif-devanagari-devanagari-wght-normal.woff2', weight: '100 900', display: 'swap' });
const devaSerifLatin = localFont({ src: './noto-serif-devanagari-latin-wght-normal.woff2', weight: '100 900', display: 'swap' });

const family = (f: { style: { fontFamily: string } }) => f.style.fontFamily;

export const devaSansStack = `${family(devaSansDeva)}, ${family(devaSansLatin)}`;
export const devaSerifStack = `${family(devaSerifDeva)}, ${family(devaSerifLatin)}`;

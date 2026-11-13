import type { CSSProperties } from 'react';
import { devaSansStack, devaSerifStack } from '@/fonts';
import '@/styles/political.css';

/**
 * Nepali deserves a typeface drawn for it. The site's Latin font has no
 * Devanagari, so the browser would fall back to whatever the device happens to
 * have, which on Windows is usually a poor match for the headings this page
 * leans on.
 */
const fontVars = {
  '--font-deva-sans': devaSansStack,
  '--font-deva-serif': devaSerifStack,
} as CSSProperties;

export default function PoliticalLayout({ children }: { children: React.ReactNode }) {
  return <div style={fontVars}>{children}</div>;
}

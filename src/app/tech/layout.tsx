import type { CSSProperties } from 'react';
import { devaSansStack, devaSerifStack } from '@/fonts';
import '@/styles/tech.css';

/**
 * Simplified Tech stands on its own: none of the main site's header, footer or
 * palette. Each page wraps itself in <TechShell>, which needs the language from
 * the address and so cannot live in this layout.
 */
const fontVars = {
  '--st-deva': devaSansStack,
  '--st-deva-serif': devaSerifStack,
} as CSSProperties;

export default function TechLayout({ children }: { children: React.ReactNode }) {
  return <div style={fontVars}>{children}</div>;
}

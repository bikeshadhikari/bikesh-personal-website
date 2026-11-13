import type { CSSProperties } from 'react';
import { devaSansStack } from '@/fonts';
import '@/styles/quiz.css';

/**
 * The game gets a typeface drawn for Devanagari, self-hosted with the site
 * rather than fetched from anyone else's server — an in-app browser on a slow
 * connection should not be waiting on a third party to show a question. If it
 * fails to load the stack falls through to the device's own UI font.
 */
const fontVars = {
  '--quiz-font': `${devaSansStack}, system-ui, -apple-system, 'Segoe UI', sans-serif`,
} as CSSProperties;

export default function QuizLayout({ children }: { children: React.ReactNode }) {
  return <div style={fontVars}>{children}</div>;
}

import { Noto_Sans_Devanagari } from 'next/font/google';
import '@/styles/quiz.css';

/**
 * The game gets a typeface drawn for Devanagari, self-hosted by the framework
 * rather than fetched from anyone else's server — an in-app browser on a slow
 * connection should not be waiting on a third party to show a question. If it
 * fails to load the stack falls through to the device's own UI font.
 */
const deva = Noto_Sans_Devanagari({
  subsets: ['devanagari', 'latin'],
  weight: ['400', '600', '700', '800'],
  display: 'swap',
  fallback: ['system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
  variable: '--quiz-font',
});

export default function QuizLayout({ children }: { children: React.ReactNode }) {
  return <div className={deva.variable}>{children}</div>;
}

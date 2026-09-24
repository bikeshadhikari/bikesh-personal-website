import { Noto_Sans_Devanagari, Noto_Serif_Devanagari } from 'next/font/google';
import '@/styles/political.css';

/**
 * Nepali deserves a typeface drawn for it. The site's Latin font has no
 * Devanagari, so the browser would fall back to whatever the device happens to
 * have, which on Windows is usually a poor match for the headings this page
 * leans on.
 */
const devaSans = Noto_Sans_Devanagari({
  subsets: ['devanagari', 'latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-deva-sans',
});

const devaSerif = Noto_Serif_Devanagari({
  subsets: ['devanagari', 'latin'],
  weight: ['400', '600', '700'],
  display: 'swap',
  variable: '--font-deva-serif',
});

export default function PoliticalLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${devaSans.variable} ${devaSerif.variable}`}>{children}</div>;
}

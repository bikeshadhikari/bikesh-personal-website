import Link from 'next/link';
import { num, type Lang, type UiText } from '@/lib/tech';

export default function Pager({ page, pages, lang, t, base, L }: {
  page: number; pages: number; lang: Lang; t: UiText; base: string; L: (h: string) => string;
}) {
  if (pages <= 1) return null;
  const at = (p: number) => L(p === 1 ? base : `${base}${base.includes('?') ? '&' : '?'}page=${p}`);
  return (
    <nav className="st-pager st-mono" aria-label={t.page}>
      {page > 1 ? <Link className="st-hl st-hl-tight" href={at(page - 1)}>← {t.prev}</Link> : <span />}
      <span>{t.page} {num(page, lang)} / {num(pages, lang)}</span>
      {page < pages ? <Link className="st-hl st-hl-tight" href={at(page + 1)}>{t.next} →</Link> : <span />}
    </nav>
  );
}

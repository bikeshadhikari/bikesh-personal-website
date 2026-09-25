import type { Metadata } from 'next';
import QuizGame from '@/components/quiz/QuizGame';
import { availability, getQuizSettings, qs } from '@/lib/quiz';
import { siteOrigin } from '@/lib/utils';

export const dynamic = 'force-dynamic';

/** The wording the game needs in the browser, gathered in one place. */
const CLIENT_KEYS = [
  'quiz_badge', 'quiz_title', 'quiz_subtitle', 'quiz_hero_text', 'quiz_chips',
  'quiz_name_label', 'quiz_name_placeholder', 'quiz_start_button',
  'quiz_count_basic', 'quiz_count_medium', 'quiz_count_hard',
  'quiz_transition_basic', 'quiz_transition_medium', 'quiz_transition_final',
  'quiz_result_title', 'quiz_perfect_title',
  'quiz_share_title', 'quiz_share_description', 'quiz_share_hashtag',
];

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getQuizSettings();
  const title = qs(settings, 'quiz_share_title');
  const description = qs(settings, 'quiz_share_description');
  const cover = qs(settings, 'quiz_share_image');

  // An uploaded picture wins; naming none leaves the drawn card beside this
  // file to serve, so a shared link never arrives as bare text.
  const images = cover
    ? { images: [{ url: cover, width: 1200, height: 630, alt: title }] }
    : {};

  return {
    title,
    description,
    alternates: { canonical: '/play-nepali-congress-quiz' },
    openGraph: {
      type: 'website',
      url: `${siteOrigin()}/play-nepali-congress-quiz`,
      title, description, ...images,
    },
    twitter: { card: 'summary_large_image', title, description, ...images },
  };
}

/**
 * The public game.
 *
 * The page itself is rendered on the server and carries only wording; the
 * questions never travel with it. They are fetched when a game begins, without
 * their answers, so nothing in the page source gives the game away.
 */
export default async function QuizPage() {
  const settings = await getQuizSettings();
  const open = availability(settings);

  if (!open.open) {
    return (
      <main className="quiz">
        <div className="q-card q-closed">
          <p className="q-badge">{qs(settings, 'quiz_badge')}</p>
          <h1>{qs(settings, 'quiz_title')}</h1>
          <p>{open.reason}</p>
        </div>
      </main>
    );
  }

  const text = Object.fromEntries(CLIENT_KEYS.map((key) => [key, qs(settings, key)]));

  return (
    <main className="quiz">
      <QuizGame text={text} privacyNote={qs(settings, 'quiz_privacy')} />

      <footer className="q-foot">
        <strong>{qs(settings, 'quiz_footer')}</strong>
        <p>{qs(settings, 'quiz_footer_note')}</p>
        <ul>
          <li><a href="https://nepalicongress.org/" target="_blank" rel="noopener noreferrer nofollow">nepalicongress.org</a></li>
          <li><a href="https://app.nepalicongress.org/history/" target="_blank" rel="noopener noreferrer nofollow">इतिहास</a></li>
          <li><a href="https://nepalicongress.org/timeline/" target="_blank" rel="noopener noreferrer nofollow">कालक्रम</a></li>
        </ul>
      </footer>
    </main>
  );
}

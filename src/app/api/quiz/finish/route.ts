import { QuizError, finishGame, getQuizSettings } from '@/lib/quiz';

export const dynamic = 'force-dynamic';

/**
 * Close a game and return the result.
 *
 * Worked out from the answers on record, never from anything the browser
 * sends. Safe to call more than once, so a player whose connection dropped can
 * retry without losing the game or double-counting it.
 */
export async function POST(request: Request): Promise<Response> {
  let sessionId = '';
  try {
    const body = await request.json();
    sessionId = String(body?.sessionId ?? '').slice(0, 36);
  } catch {
    return Response.json({ error: 'bad request' }, { status: 400 });
  }
  if (!sessionId) return Response.json({ error: 'bad request' }, { status: 400 });

  try {
    const settings = await getQuizSettings();
    return Response.json(await finishGame(sessionId, settings));
  } catch (error) {
    if (error instanceof QuizError) {
      return Response.json({ error: error.message, code: error.code }, { status: 409 });
    }
    return Response.json({ error: 'परिणाम सुरक्षित गर्न समस्या भयो ।' }, { status: 500 });
  }
}

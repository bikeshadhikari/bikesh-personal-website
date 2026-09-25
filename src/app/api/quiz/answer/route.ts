import { QuizError, getQuizSettings, recordAnswer } from '@/lib/quiz';

export const dynamic = 'force-dynamic';

/**
 * Record one answer and say whether it was right.
 *
 * The browser sends the seat it tapped and nothing else; the verdict is worked
 * out here from the stored question, so a player editing what they send can
 * change which answer they gave but never whether it counts as correct.
 */
export async function POST(request: Request): Promise<Response> {
  let sessionId = '';
  let questionId = 0;
  let seat = '';
  let responseMs = 0;

  try {
    const body = await request.json();
    sessionId = String(body?.sessionId ?? '').slice(0, 36);
    questionId = Number(body?.questionId);
    seat = String(body?.option ?? '').toUpperCase().slice(0, 1);
    responseMs = Number(body?.responseMs) || 0;
  } catch {
    return Response.json({ error: 'bad request' }, { status: 400 });
  }

  if (!sessionId || !Number.isSafeInteger(questionId) || questionId <= 0) {
    return Response.json({ error: 'bad request' }, { status: 400 });
  }

  try {
    const settings = await getQuizSettings();
    return Response.json(await recordAnswer(sessionId, questionId, seat, responseMs, settings));
  } catch (error) {
    if (error instanceof QuizError) {
      return Response.json({ error: error.message, code: error.code }, { status: 409 });
    }
    console.error('quiz answer failed', error);
    return Response.json({ error: 'उत्तर सुरक्षित गर्न समस्या भयो ।' }, { status: 500 });
  }
}

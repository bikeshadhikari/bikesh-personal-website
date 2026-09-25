import {
  QuizError, availability, getQuizSettings, hashIp, recentStarts, startGame,
} from '@/lib/quiz';

export const dynamic = 'force-dynamic';

const MAX_STARTS_PER_MINUTE = 12;

/** The caller's address, as far as the proxy in front of us reports it. */
function addressOf(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for') ?? '';
  return forwarded.split(',')[0].trim() || request.headers.get('x-real-ip') || 'unknown';
}

function fail(message: string, code: string, status: number): Response {
  return Response.json({ error: message, code }, { status });
}

/**
 * Begin a game.
 *
 * The questions come back without their answers: nothing the browser holds
 * decides whether a tap was right.
 */
export async function POST(request: Request): Promise<Response> {
  let name = '';
  try {
    const body = await request.json();
    name = String(body?.name ?? '').replace(/\s+/g, ' ').trim().slice(0, 80);
  } catch {
    return fail('खेल सुरु गर्न समस्या भयो ।', 'body', 400);
  }

  // Two characters is the floor the first screen states; the upper bound and
  // the stripping of control characters are here because the name is shown
  // back to whoever opens the results.
  if (name.replace(/[\u0000-\u001f\u007f]/g, '').length < 2) {
    return fail('कृपया आफ्नो नाम लेख्नुहोस् (कम्तीमा २ अक्षर) ।', 'name', 422);
  }
  name = name.replace(/[\u0000-\u001f\u007f]/g, '');

  const settings = await getQuizSettings();
  const open = availability(settings);
  if (!open.open) return fail(open.reason, 'closed', 403);

  const ipHash = hashIp(addressOf(request));
  if (await recentStarts(ipHash) >= MAX_STARTS_PER_MINUTE) {
    return fail('केही बेरपछि फेरि प्रयास गर्नुहोस् ।', 'rate', 429);
  }

  try {
    const game = await startGame(name, settings, ipHash);
    return Response.json({ ...game, name });
  } catch (error) {
    if (error instanceof QuizError && error.code === 'pool') {
      return fail('प्रश्न पर्याप्त छैनन् । कृपया पछि प्रयास गर्नुहोस् ।', 'pool', 503);
    }
    return fail('खेल सुरु गर्न समस्या भयो ।', 'server', 500);
  }
}

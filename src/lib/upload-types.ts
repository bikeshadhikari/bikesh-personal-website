/**
 * What the uploader accepts, in a form both sides can read.
 *
 * Kept apart from upload.ts because that module is server-only — it talks to
 * the database — while the file picker choosing what to offer runs in the
 * browser. Both need the same answer about what counts as a recording.
 */

export const IMAGE_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
  'image/avif', 'image/x-icon', 'image/vnd.microsoft.icon',
];

export const DOC_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

/**
 * Every shape a recording turns up in.
 *
 * A phone rarely hands over an .mp3. A voice memo is .m4a, which browsers
 * report as audio/mp4 or, when the recording came out of a camera app, as
 * video/mp4 with nothing but sound in it. WhatsApp sends .ogg with Opus
 * inside, Android's recorder still produces .amr and .3gp, and a browser
 * recording is .webm. An <audio> element plays all of them, so the uploader
 * has no business turning them away — including the video containers, which
 * for this purpose are audio files that happen to allow a picture track.
 */
export const AUDIO_TYPES = [
  'audio/mpeg', 'audio/mp3', 'audio/mp4', 'audio/m4a', 'audio/x-m4a',
  'audio/aac', 'audio/aacp', 'audio/ogg', 'audio/opus', 'audio/vorbis',
  'audio/wav', 'audio/wave', 'audio/x-wav', 'audio/vnd.wave',
  'audio/webm', 'audio/flac', 'audio/x-flac',
  'audio/3gpp', 'audio/3gpp2', 'audio/amr', 'audio/x-caf', 'audio/basic',
  'video/mp4', 'video/webm', 'video/ogg', 'video/3gpp', 'video/quicktime',
];

export const ALLOWED_TYPES = [...IMAGE_TYPES, ...DOC_TYPES, ...AUDIO_TYPES];

/** What the file picker should offer for a field that wants a recording. */
export const AUDIO_ACCEPT =
  'audio/*,video/mp4,video/webm,video/ogg,video/3gpp,.m4a,.amr,.opus,.caf';

/**
 * The type a browser reported, reduced to something comparable.
 *
 * A media type can carry parameters — audio/ogg; codecs=opus is what a
 * WhatsApp voice note arrives as — and casing is not guaranteed.
 */
function baseType(reported: string): string {
  return reported.split(';')[0].trim().toLowerCase();
}

/** Types a browser cannot name, recognised by the file's own ending instead. */
const BY_EXTENSION: Record<string, string> = {
  mp3: 'audio/mpeg', m4a: 'audio/mp4', m4b: 'audio/mp4', aac: 'audio/aac',
  oga: 'audio/ogg', ogg: 'audio/ogg', opus: 'audio/opus', wav: 'audio/wav',
  flac: 'audio/flac', amr: 'audio/amr', '3gp': 'audio/3gpp', '3ga': 'audio/3gpp',
  caf: 'audio/x-caf', weba: 'audio/webm', mp4: 'video/mp4', webm: 'video/webm',
  mov: 'video/quicktime',
};

/**
 * What a file really is, as far as this uploader is concerned.
 *
 * Some systems hand over an empty type, or application/octet-stream, for the
 * very formats people are most likely to upload here — .m4a and .amr among
 * them. Refusing those on the strength of a blank field would be refusing a
 * perfectly good recording, so the name settles it instead.
 */
export function resolveType(reported: string, filename: string): string {
  const base = baseType(reported);
  if (base && base !== 'application/octet-stream') return base;

  const extension = filename.toLowerCase().split('.').pop() ?? '';
  return BY_EXTENSION[extension] ?? base;
}

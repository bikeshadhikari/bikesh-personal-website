'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type CardFacts = {
  name: string;
  score: number;
  maxScore: number;
  correct: number;
  total: number;
  level: string;
  stars: number;
  perfect: boolean;
};

export type CardText = {
  badge: string;
  headline: string;
  invite: string;
  candidateName: string;
  candidateRole: string;
  hashtags: string;
  url: string;
};

const W = 1080;
const H = 1350;
const RED = '#c8102e';
const NAVY = '#16375f';
const GOLD = '#e3a008';

/**
 * The card a player shares, painted in the browser on a canvas.
 *
 * Drawn here rather than generated on the server because the server's image
 * renderer places glyphs in code-point order and cannot reorder Devanagari
 * matras — Nepali comes out misspelt. A canvas uses the browser's own text
 * engine, which shapes the script properly, and it costs no round trip.
 *
 * The flag is the real party flag, bent along a sine wave a strip at a time so
 * it reads as flying rather than pasted on.
 */
export default function ResultCard(
  { facts, text }: { facts: CardFacts; text: CardText },
) {
  const canvas = useRef<HTMLCanvasElement | null>(null);
  const [png, setPng] = useState<Blob | null>(null);
  const [state, setState] = useState<'' | 'saved' | 'copied' | 'sharing'>('');
  const [failed, setFailed] = useState('');

  // What the card actually depends on, as one comparable value. The props are
  // fresh objects on every render, and the result screen re-renders on every
  // tick of the score counter — without this the whole canvas, flag strips and
  // all, would be redrawn twenty-odd times while that animation runs.
  const signature = JSON.stringify([facts, text]);

  const paint = useCallback(async () => {
    const node = canvas.current;
    if (!node) return;
    const ctx = node.getContext('2d');
    if (!ctx) return;

    // The page's own Devanagari face, so the card matches the screen. Waiting
    // for it matters: a canvas drawn before the font arrives silently falls
    // back to whatever the device has.
    const family = getComputedStyle(node).fontFamily || 'sans-serif';
    try { await document.fonts?.ready; } catch { /* older browser */ }

    ctx.clearRect(0, 0, W, H);

    // Ground.
    const sky = ctx.createLinearGradient(0, 0, W, H);
    sky.addColorStop(0, '#fdf8ee');
    sky.addColorStop(0.55, '#ffffff');
    sky.addColorStop(1, '#eef3f9');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    // The national colours across the top and bottom.
    for (const y of [0, H - 18]) {
      const band = [RED, NAVY, GOLD];
      band.forEach((colour, i) => {
        ctx.fillStyle = colour;
        ctx.fillRect((W / 3) * i, y, W / 3 + 1, 18);
      });
    }

    const centre = (line: string, y: number, size: number, colour: string, weight = '700') => {
      ctx.fillStyle = colour;
      ctx.font = `${weight} ${size}px ${family}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(line, W / 2, y);
    };

    /** Break a line to fit, and return where the next line should sit. */
    const wrap = (
      line: string, y: number, size: number, colour: string, weight = '600', max = W - 140,
    ): number => {
      ctx.font = `${weight} ${size}px ${family}`;
      const words = line.split(' ');
      let current = '';
      let at = y;
      for (const word of words) {
        const next = current ? `${current} ${word}` : word;
        if (ctx.measureText(next).width > max && current) {
          centre(current, at, size, colour, weight);
          at += size * 1.45;
          current = word;
        } else current = next;
      }
      if (current) { centre(current, at, size, colour, weight); at += size * 1.45; }
      return at;
    };

    // The headline only: the badge said very nearly the same thing, and twice
    // over it read as a mistake rather than as emphasis.
    let y = 104;
    centre(text.headline, y, 46, NAVY, '800');

    // The flag, flying.
    const flagTop = y + 44;
    await drawWavingFlag(ctx, W / 2 - 210, flagTop, 420, 280);

    // Clear of the pole, which hangs below the cloth.
    y = flagTop + 280 + 92;

    // Who played.
    centre(facts.name, y, 62, NAVY, '800');
    y += 76;

    // The score, the piece people actually look at.
    ctx.textAlign = 'center';
    const scoreText = `${facts.score}`;
    ctx.font = `800 132px ${family}`;
    const scoreWidth = ctx.measureText(scoreText).width;
    ctx.font = `700 54px ${family}`;
    const restWidth = ctx.measureText(` / ${facts.maxScore}`).width;
    const startX = W / 2 - (scoreWidth + restWidth) / 2;

    ctx.textAlign = 'left';
    ctx.fillStyle = RED;
    ctx.font = `800 132px ${family}`;
    ctx.fillText(scoreText, startX, y + 46);
    ctx.fillStyle = NAVY;
    ctx.font = `700 54px ${family}`;
    ctx.fillText(` / ${facts.maxScore}`, startX + scoreWidth, y + 46);
    ctx.textAlign = 'center';

    y += 108;
    centre(`${facts.correct} / ${facts.total} सही`, y, 40, '#5d6b7e', '600');

    // Stars, filled to the level reached.
    y += 74;
    drawStars(ctx, W / 2, y, facts.stars);

    // The level, on a badge.
    y += 84;
    ctx.font = `800 40px ${family}`;
    const levelWidth = ctx.measureText(facts.level).width + 86;
    roundedRect(ctx, W / 2 - levelWidth / 2, y - 44, levelWidth, 70, 35);
    const badge = ctx.createLinearGradient(0, y - 44, 0, y + 26);
    badge.addColorStop(0, GOLD);
    badge.addColorStop(1, '#c07f05');
    ctx.fillStyle = badge;
    ctx.fill();
    centre(facts.level, y + 4, 40, '#2a1e00', '800');

    // The invitation to play.
    y += 96;
    y = wrap(text.invite, y, 34, NAVY, '600');

    // Who made it, stated plainly.
    y += 18;
    centre(text.candidateName, y, 40, RED, '800');
    y += 50;
    y = wrap(text.candidateRole, y, 27, '#5d6b7e', '600', W - 180);

    // Hashtags and the link, at the foot.
    centre(text.hashtags, H - 96, 30, NAVY, '700');
    centre(text.url, H - 52, 26, '#5d6b7e', '600');

    node.toBlob((blob) => setPng(blob), 'image/png');
    // The props themselves are read through the closure; the signature is what
    // decides whether any of it has actually changed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  useEffect(() => { void paint(); }, [paint]);

  const fileName = `nepali-congress-quiz-${facts.name.replace(/\s+/g, '-').slice(0, 30) || 'result'}.png`;
  const message = `${text.headline}\n${text.invite}\n\n${facts.name} — ${facts.score}/${facts.maxScore} · ${facts.level}\n\n${text.hashtags}\n${text.url}`;

  /** Hand the picture to whatever the device shares with. */
  const shareCard = async () => {
    setFailed('');
    setState('sharing');
    try {
      const blob = png ?? await new Promise<Blob | null>((resolve) => {
        canvas.current?.toBlob(resolve, 'image/png');
      });
      const file = blob ? new File([blob], fileName, { type: 'image/png' }) : null;

      // A share sheet that takes the picture is the one worth using; several
      // in-app browsers accept text but refuse files, so both are tried.
      if (file && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text: message });
        setState('');
        return;
      }
      if (navigator.share) {
        await navigator.share({ text: message, url: text.url });
        setState('');
        return;
      }
      download();
    } catch (error) {
      // A dismissed share sheet is not a failure worth reporting.
      if (error instanceof Error && error.name === 'AbortError') { setState(''); return; }
      download();
    }
  };

  const download = () => {
    try {
      const node = canvas.current;
      if (!node) return;
      const link = document.createElement('a');
      link.download = fileName;
      link.href = node.toDataURL('image/png');
      link.click();
      setState('saved');
      window.setTimeout(() => setState(''), 2400);
    } catch {
      setFailed('कार्ड सुरक्षित गर्न सकिएन । तस्बिरमा थिचेर सेभ गर्नुहोस् ।');
      setState('');
    }
  };

  const copyMessage = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setState('copied');
      window.setTimeout(() => setState(''), 2400);
    } catch {
      setFailed('कपी हुन सकेन । तलको लेख छानेर कपी गर्नुहोस् ।');
    }
  };

  const target = encodeURIComponent(text.url);
  const quote = encodeURIComponent(message);

  return (
    <div className="q-cardshare">
      <canvas ref={canvas} width={W} height={H} className="q-cardimg"
              aria-label="परिणाम कार्ड" role="img" />

      <p className="q-cardhint">तस्बिरमा केही बेर थिचेर पनि सेभ गर्न सकिन्छ ।</p>

      <div className="q-actions">
        <button type="button" className="q-btn q-btn-solid" onClick={() => void shareCard()}>
          {state === 'sharing' ? 'तयार हुँदैछ…' : '📤 कार्ड शेयर गर्नुहोस्'}
        </button>
        <button type="button" className="q-btn q-btn-ghost" onClick={download}>
          {state === 'saved' ? '✓ सेभ भयो' : '⬇ कार्ड डाउनलोड'}
        </button>
      </div>

      {/* Direct links for the apps whose in-app browser has no share sheet. */}
      <ul className="q-social">
        <li>
          <a href={`https://www.facebook.com/sharer/sharer.php?u=${target}&quote=${quote}`}
             target="_blank" rel="noopener noreferrer">Facebook</a>
        </li>
        <li>
          {/* Messenger's web dialog needs an app id of its own, so this is the
              handover to the installed app. On a desktop with no Messenger the
              share button above is the one that works. */}
          <a href={`fb-messenger://share/?link=${target}`}>Messenger</a>
        </li>
        <li>
          <a href={`https://twitter.com/intent/tweet?text=${quote}`}
             target="_blank" rel="noopener noreferrer">X</a>
        </li>
        <li>
          <a href={`https://wa.me/?text=${quote}`}
             target="_blank" rel="noopener noreferrer">WhatsApp</a>
        </li>
        <li>
          <button type="button" onClick={() => void copyMessage()}>
            {state === 'copied' ? '✓ कपी भयो' : 'Instagram — लेख कपी'}
          </button>
        </li>
      </ul>

      {failed && <p className="q-error" role="alert">{failed}</p>}
      <p className="q-cardnote">
        Instagram मा तस्बिर पोस्ट गर्न कार्ड डाउनलोड गरेर एपबाट हाल्नुहोस् ।
      </p>
    </div>
  );
}

/* ------------------------------------------------------------- drawing */

function roundedRect(
  ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawStars(ctx: CanvasRenderingContext2D, cx: number, cy: number, filled: number): void {
  const size = 34;
  const gap = 82;
  const start = cx - gap * 2;
  for (let i = 0; i < 5; i += 1) {
    star(ctx, start + gap * i, cy, size);
    ctx.fillStyle = i < filled ? GOLD : 'rgba(22, 55, 95, .16)';
    ctx.fill();
    if (i < filled) {
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#c07f05';
      ctx.stroke();
    }
  }
}

function star(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number): void {
  ctx.beginPath();
  for (let i = 0; i < 10; i += 1) {
    const radius = i % 2 === 0 ? r : r * 0.44;
    const angle = (Math.PI / 5) * i - Math.PI / 2;
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

/**
 * The party flag, bent along a sine wave.
 *
 * Drawn a strip at a time, each shifted vertically and squeezed slightly, which
 * is what gives the cloth its fold. Falls back to nothing at all if the picture
 * cannot be loaded: a card without a flag still shares.
 */
async function drawWavingFlag(
  ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number,
): Promise<void> {
  const flag = await loadImage('/political/flag.png').catch(() => null);
  if (!flag) return;

  const strips = 90;
  const stripWidth = w / strips;
  const amplitude = h * 0.075;

  ctx.save();
  ctx.shadowColor = 'rgba(22, 55, 95, .28)';
  ctx.shadowBlur = 26;
  ctx.shadowOffsetY = 12;

  for (let i = 0; i < strips; i += 1) {
    const through = i / strips;
    const lift = Math.sin(through * Math.PI * 2.1) * amplitude * through;
    const squeeze = 1 - Math.abs(Math.cos(through * Math.PI * 2.1)) * 0.06 * through;

    ctx.drawImage(
      flag,
      (flag.width / strips) * i, 0, flag.width / strips + 1, flag.height,
      x + stripWidth * i, y + lift + (h * (1 - squeeze)) / 2,
      stripWidth + 1, h * squeeze,
    );
    // Shadow only under the whole shape, not between every strip.
    ctx.shadowColor = 'transparent';
  }
  ctx.restore();

  // The pole, stopping just below the cloth rather than running on into
  // whatever the card puts underneath it.
  ctx.fillStyle = NAVY;
  roundedRect(ctx, x - 13, y - 8, 9, h + 16, 5);
  ctx.fill();
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('flag missing'));
    image.src = src;
  });
}

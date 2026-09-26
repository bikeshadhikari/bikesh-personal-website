/**
 * Draw the quiz's share card from the quiz's own opening screen.
 *
 * The card has to carry Nepali, and the image renderer the rest of the site
 * uses places glyphs in code-point order — it cannot reorder Devanagari
 * matras, so anything it writes in Nepali comes out misspelt. A browser shapes
 * the script properly, so the card is composed inside the running page, using
 * the font that page has already loaded, and photographed.
 *
 * Run it with the site running, after changing any of the opening wording:
 *
 *   npm start &                      # or npm run dev
 *   node scripts/make-quiz-card.cjs  # writes public/quiz/share.png
 */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const { execFile } = require('node:child_process');
const { mkdirSync, statSync, unlinkSync } = require('node:fs');
const { resolve } = require('node:path');

const SITE = process.env.SITE ?? 'http://localhost:3000';
const RAW = resolve(process.cwd(), 'public/quiz/.share-raw.png');
const OUT = resolve(process.cwd(), 'public/quiz/share.jpg');

(async () => {
  mkdirSync(resolve(process.cwd(), 'public/quiz'), { recursive: true });

  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args: ['--no-sandbox'],
  });
  // Twice the size, so the card stays sharp where a feed shows it large.
  const page = await browser.newPage({
    viewport: { width: 1200, height: 700 }, deviceScaleFactor: 2,
  });
  await page.goto(`${SITE}/play-nepali-congress-quiz`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts?.ready);

  // Compose the card from what the page itself says, so the two never drift.
  await page.evaluate(() => {
    const text = (selector, fallback = '') =>
      document.querySelector(selector)?.textContent?.trim() ?? fallback;

    const card = document.createElement('div');
    card.id = 'share-card';
    card.style.cssText = `
      position: fixed; top: 0; left: 0; z-index: 99999;
      width: 1200px; height: 630px; display: flex; align-items: center;
      gap: 56px; padding: 64px 72px; box-sizing: border-box;
      background:
        radial-gradient(900px 500px at 8% -20%, rgba(200,16,46,.18), transparent 60%),
        radial-gradient(800px 460px at 96% 0%, rgba(227,160,8,.22), transparent 55%),
        linear-gradient(160deg, #fdf8ee 0%, #ffffff 48%, #f2f6fb 100%);
      font-family: ${getComputedStyle(document.querySelector('.quiz')).fontFamily};
      overflow: hidden;`;

    const emblem = document.querySelector('.q-emblem-plate img')?.getAttribute('src') ?? '';

    card.innerHTML = `
      <div style="position:absolute;top:0;left:0;right:0;height:12px;display:flex">
        <div style="flex:1;background:#c8102e"></div>
        <div style="flex:1;background:#16375f"></div>
        <div style="flex:1;background:#e3a008"></div>
      </div>

      <div style="flex:1 1 0;min-width:0;display:flex;flex-direction:column;
                  align-items:flex-start;justify-content:center;gap:0">
        <div style="display:inline-block;padding:9px 20px;border-radius:999px;
                    background:linear-gradient(135deg,#c8102e,#98122b);color:#fff;
                    font-size:21px;font-weight:700;margin-bottom:20px">
          ${text('.q-badge')}
        </div>
        <div style="font-size:84px;font-weight:800;line-height:1.08;color:#16375f;
                    margin-bottom:12px">${text('.q-title')}</div>
        <div style="font-size:38px;font-weight:700;color:#0b6b3a;margin-bottom:28px">
          ${text('.q-subtitle')}
        </div>
        <div style="font-size:26px;font-weight:600;color:#5d6b7e;line-height:1.6;
                    margin-bottom:30px">
          ११ प्रश्न · आधारभूत → कठिन · हरेक खेलमा नयाँ सेट
        </div>
        <div style="font-size:23px;font-weight:700;color:#16375f;letter-spacing:.01em">
          bikeshadhikari.com.np/play-nepali-congress-quiz
        </div>
      </div>

      <div style="flex:0 0 360px;display:flex;flex-direction:column;align-items:center;
                  gap:18px;text-align:center">
        ${emblem ? `
        <div style="width:230px;height:230px;border-radius:50%;overflow:hidden;position:relative;
                    background:radial-gradient(circle at 50% 38%,#fff 0%,#f6faf7 62%,#eaf3ec 100%);
                    box-shadow:0 18px 40px -20px rgba(22,55,95,.5),
                               inset 0 0 0 1px rgba(22,55,95,.12)">
          <img src="${emblem}" style="position:absolute;top:50%;left:50%;
               transform:translate(-50%,-50%);width:78%;height:78%;object-fit:contain">
        </div>` : ''}
        <div style="font-size:30px;font-weight:800;color:#0b6b3a;line-height:1.2">
          ${text('.q-cand-name')}
        </div>
        <div style="padding:12px 20px;border-radius:14px;
                    background:linear-gradient(135deg,#c8102e,#a50d26);color:#fff">
          <div style="font-size:19px;font-weight:800;line-height:1.35">
            ${text('.q-cand-badge strong')}
          </div>
          <div style="font-size:16px;font-weight:600;opacity:.94;line-height:1.4;margin-top:2px">
            ${text('.q-cand-badge small')}
          </div>
        </div>
      </div>`;

    document.body.appendChild(card);
  });

  await page.waitForTimeout(600);
  await page.locator('#share-card').screenshot({ path: RAW });
  await browser.close();

  // Down to the size the specification asks for, and to JPEG.
  //
  // Size is the point: WhatsApp quietly shows no picture at all when the one
  // it fetches is over a few hundred kilobytes, and WhatsApp is where most of
  // these links get pasted. A megabyte of PNG previews as nothing.
  await new Promise((done, fail) => {
    execFile('python3', ['-c', `
from PIL import Image
im = Image.open(${JSON.stringify(RAW)}).convert('RGB').resize((1200, 630), Image.LANCZOS)
im.save(${JSON.stringify(OUT)}, 'JPEG', quality=86, optimize=True, progressive=True)
`], (error) => (error ? fail(error) : done(null)));
  });
  unlinkSync(RAW);

  const { size } = statSync(OUT);
  console.log(`wrote ${OUT} — ${Math.round(size / 1024)} KB`);
})();

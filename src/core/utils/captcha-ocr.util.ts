import sharp from "sharp";
import { createWorker, PSM, type Worker } from "tesseract.js";
import { LoggerEngine } from "../engine/logger.engine";

/** Same charset as the login SVG CAPTCHA (no 0/O/1/I/l/i). */
export const CAPTCHA_OCR_CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";

/** Live login CAPTCHA is 4–6 characters after charset filter. */
export const CAPTCHA_MIN_LENGTH = 4;
export const CAPTCHA_MAX_LENGTH = 6;

const TESS_DEBUG_FILE = process.platform === "win32" ? "nul" : "/dev/null";

let ocrWorker: Promise<Worker> | undefined;

function getOcrWorker(): Promise<Worker> {
  if (!ocrWorker) {
    ocrWorker = (async () => {
      const worker = await createWorker("eng", 1, {
        logger: () => undefined,
        errorHandler: () => undefined,
      });
      await worker.setParameters({
        tessedit_char_whitelist: CAPTCHA_OCR_CHARSET,
        // Quiet legacy adaptive-thresholder dumps that print "Total count=0".
        debug_file: TESS_DEBUG_FILE,
      });
      return worker;
    })();
  }
  return ocrWorker;
}

/** Load Tesseract before GET /captcha so OCR does not burn the captcha TTL. */
export async function warmupCaptchaOcr(): Promise<void> {
  await getOcrWorker();
}

function decodeCaptchaSvg(svg: string): string {
  const trimmed = svg.trim();
  const dataUri = /^data:image\/svg\+xml([^,]*),(.*)$/is.exec(trimmed);
  if (!dataUri) {
    return trimmed;
  }
  const meta = dataUri[1] ?? "";
  const payload = dataUri[2] ?? "";
  if (/base64/i.test(meta)) {
    return Buffer.from(payload, "base64").toString("utf8");
  }
  try {
    return decodeURIComponent(payload);
  } catch {
    return payload;
  }
}

export function normalizeCaptchaOcrText(raw: string): string {
  return raw
    .replace(/\s+/g, "")
    .split("")
    .filter((ch) => CAPTCHA_OCR_CHARSET.includes(ch))
    .join("");
}

export function isPlausibleCaptchaGuess(guess: string): boolean {
  return guess.length >= CAPTCHA_MIN_LENGTH && guess.length <= CAPTCHA_MAX_LENGTH;
}

type RasterPass = {
  name: string;
  build: (svg: Buffer) => Promise<Buffer>;
};

/**
 * Path-glyph captchas on a light field. Keep passes few and fast so the
 * captchaId does not expire before login POST.
 */
function rasterPasses(): RasterPass[] {
  const base = (svg: Buffer, density: number, width: number, height: number) =>
    sharp(svg, { density }).resize(width, height, { fit: "fill" }).grayscale().normalize().extend({
      top: 40,
      bottom: 40,
      left: 56,
      right: 56,
      background: "#ffffff",
    });

  return [
    {
      name: "hires-sharp",
      build: (svg) => base(svg, 400, 1600, 400).sharpen({ sigma: 1 }).png().toBuffer(),
    },
    {
      name: "contrast",
      build: (svg) =>
        base(svg, 340, 1300, 320).linear(1.45, -22).sharpen({ sigma: 1.1 }).png().toBuffer(),
    },
    {
      name: "median-sharp",
      build: (svg) => base(svg, 320, 1200, 300).median(1).sharpen({ sigma: 1.2 }).png().toBuffer(),
    },
    {
      name: "soft-threshold",
      build: (svg) => base(svg, 300, 1100, 280).threshold(165).png().toBuffer(),
    },
  ];
}

type OcrCandidate = {
  guess: string;
  confidence: number;
  pass: string;
  psm: string;
};

function pickBestGuess(candidates: OcrCandidate[]): OcrCandidate | undefined {
  if (candidates.length === 0) {
    return undefined;
  }

  const byGuess = new Map<string, { count: number; best: OcrCandidate }>();
  for (const c of candidates) {
    const cur = byGuess.get(c.guess);
    if (!cur) {
      byGuess.set(c.guess, { count: 1, best: c });
      continue;
    }
    cur.count += 1;
    if (c.confidence > cur.best.confidence) {
      cur.best = c;
    }
  }

  let winner: { count: number; best: OcrCandidate } | undefined;
  for (const entry of byGuess.values()) {
    if (
      !winner ||
      entry.count > winner.count ||
      (entry.count === winner.count && entry.best.confidence > winner.best.confidence)
    ) {
      winner = entry;
    }
  }
  return winner?.best;
}

/**
 * Rasterize a login CAPTCHA SVG and OCR the answer (4–6 charset chars).
 * Votes across soft passes; early-exits when the same guess wins twice.
 */
export async function solveCaptchaSvg(svg: string): Promise<string> {
  const trimmed = decodeCaptchaSvg(svg);
  if (!trimmed) {
    throw new Error("CAPTCHA SVG is empty");
  }

  const svgBuf = Buffer.from(trimmed);
  const worker = await getOcrWorker();
  const candidates: OcrCandidate[] = [];
  let bestPartial = "";
  const guessCounts = new Map<string, number>();

  const psmModes: Array<{ name: string; mode: PSM }> = [
    { name: "single-line", mode: PSM.SINGLE_LINE },
    { name: "single-word", mode: PSM.SINGLE_WORD },
  ];

  for (const pass of rasterPasses()) {
    let png: Buffer;
    try {
      png = await pass.build(svgBuf);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      LoggerEngine.debug(`CAPTCHA raster pass=${pass.name} failed: ${message}`);
      continue;
    }

    for (const psm of psmModes) {
      try {
        await worker.setParameters({
          tessedit_char_whitelist: CAPTCHA_OCR_CHARSET,
          tessedit_pageseg_mode: psm.mode,
          debug_file: TESS_DEBUG_FILE,
        });
        const { data } = await worker.recognize(png);
        const guess = normalizeCaptchaOcrText(data.text ?? "");
        const confidence = typeof data.confidence === "number" ? data.confidence : 0;

        if (guess.length > bestPartial.length) {
          bestPartial = guess;
        }

        if (!isPlausibleCaptchaGuess(guess)) {
          LoggerEngine.debug(
            `CAPTCHA OCR pass=${pass.name}/${psm.name} guess=${guess || "(empty)"} (rejected length)`,
          );
          continue;
        }

        candidates.push({
          guess,
          confidence,
          pass: pass.name,
          psm: psm.name,
        });
        const count = (guessCounts.get(guess) ?? 0) + 1;
        guessCounts.set(guess, count);
        LoggerEngine.debug(
          `CAPTCHA OCR pass=${pass.name}/${psm.name} guess=${guess} conf=${confidence.toFixed(1)} votes=${count}`,
        );

        // Two independent reads agree — post before captcha TTL expires.
        if (count >= 2) {
          LoggerEngine.debug(
            `CAPTCHA OCR majority accept guess=${guess} via ${pass.name}/${psm.name}`,
          );
          return guess;
        }
        if (confidence >= 78) {
          LoggerEngine.debug(
            `CAPTCHA OCR high-conf accept guess=${guess} via ${pass.name}/${psm.name} conf=${confidence.toFixed(1)}`,
          );
          return guess;
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        LoggerEngine.debug(`CAPTCHA OCR pass=${pass.name}/${psm.name} failed: ${message}`);
      }
    }
  }

  const winner = pickBestGuess(candidates);
  if (winner) {
    LoggerEngine.debug(
      `CAPTCHA OCR accepted guess=${winner.guess} via ${winner.pass}/${winner.psm} conf=${winner.confidence.toFixed(1)} (candidates=${candidates.length})`,
    );
    return winner.guess;
  }

  throw new Error(
    `CAPTCHA OCR could not read ${CAPTCHA_MIN_LENGTH}–${CAPTCHA_MAX_LENGTH} characters` +
      (bestPartial ? ` (best guess length ${bestPartial.length}: ${bestPartial})` : " (empty)"),
  );
}

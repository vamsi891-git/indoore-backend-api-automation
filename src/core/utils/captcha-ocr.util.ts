import sharp from "sharp";
import { createWorker, PSM, type Worker } from "tesseract.js";
import { LoggerEngine } from "../engine/logger.engine";

/** Same charset as the login SVG CAPTCHA (no 0/O/1/I/l/i). */
export const CAPTCHA_OCR_CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";

/** Live login CAPTCHA is 4–6 characters after charset filter. */
export const CAPTCHA_MIN_LENGTH = 4;
export const CAPTCHA_MAX_LENGTH = 6;

const DEFAULT_CAPTCHA_ATTEMPTS = 5;

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
 * Soft rasterizations. Hard binary thresholds often wipe the glyph ink
 * (Tesseract then reports Total count=0 / 2-char garbage).
 */
function rasterPasses(): RasterPass[] {
  const base = (svg: Buffer, density: number, width: number, height: number) =>
    sharp(svg, { density }).resize(width, height, { fit: "fill" }).grayscale().normalize().extend({
      top: 48,
      bottom: 48,
      left: 64,
      right: 64,
      background: "#ffffff",
    });

  return [
    {
      name: "pad-hires",
      build: (svg) => base(svg, 300, 1200, 300).sharpen({ sigma: 0.8 }).png().toBuffer(),
    },
    {
      name: "pad-contrast",
      build: (svg) =>
        base(svg, 280, 1100, 280).linear(1.35, -18).sharpen({ sigma: 1 }).png().toBuffer(),
    },
    {
      name: "pad-bright",
      build: (svg) =>
        base(svg, 250, 1000, 250)
          .modulate({ brightness: 1.15 })
          .sharpen({ sigma: 1.1 })
          .png()
          .toBuffer(),
    },
    {
      name: "soft-threshold",
      build: (svg) => base(svg, 260, 1000, 250).threshold(170).png().toBuffer(),
    },
    {
      name: "negate-soft",
      build: (svg) => base(svg, 250, 960, 240).negate().threshold(160).png().toBuffer(),
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
 * Runs several soft passes + PSM modes, then votes (majority / confidence).
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
  /** Stop extra raster/OCR work so login POSTs before the captcha expires. */
  const highConfidence = 62;

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

        if (isPlausibleCaptchaGuess(guess)) {
          candidates.push({
            guess,
            confidence,
            pass: pass.name,
            psm: psm.name,
          });
          LoggerEngine.debug(
            `CAPTCHA OCR pass=${pass.name}/${psm.name} guess=${guess} conf=${confidence.toFixed(1)}`,
          );
          if (confidence >= highConfidence) {
            LoggerEngine.debug(
              `CAPTCHA OCR early accept guess=${guess} via ${pass.name}/${psm.name} conf=${confidence.toFixed(1)}`,
            );
            return guess;
          }
        } else {
          LoggerEngine.debug(
            `CAPTCHA OCR pass=${pass.name}/${psm.name} guess=${guess || "(empty)"} (rejected length)`,
          );
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

function isInvalidCaptchaError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /INVALID_CAPTCHA/i.test(message);
}

/**
 * Staff login with OCR CAPTCHA. Retries live inside AuthApi.login (INVALID_CAPTCHA).
 */
export async function getAuthenticatedSession(
  email: string,
  password: string,
  maxAttempts = DEFAULT_CAPTCHA_ATTEMPTS,
): Promise<{ accessToken: string }> {
  const { AuthApi } = await import("./auth.util");
  try {
    const session = await AuthApi.login({ email, password });
    LoggerEngine.debug(`CAPTCHA login succeeded (maxAttempts=${maxAttempts})`);
    return { accessToken: session.accessToken };
  } catch (error) {
    const lastError = error instanceof Error ? error : new Error(String(error));
    if (isInvalidCaptchaError(lastError) && !/after \d+ CAPTCHA attempt/i.test(lastError.message)) {
      throw new Error(
        `Login failed after ${maxAttempts} CAPTCHA attempt(s). ${lastError.message}`,
        { cause: error },
      );
    }
    throw lastError;
  }
}

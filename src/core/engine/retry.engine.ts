import { LoggerEngine } from "./logger.engine";

type RetryableTask<T> = (attempt: number) => Promise<T>;
type ShouldRetry<T> = (result: T | undefined, error: unknown) => boolean;

export class RetryEngine {
  static async execute<T>(
    task: RetryableTask<T>,
    shouldRetry: ShouldRetry<T>,
    config: { retries: number; delayMs: number; label: string }
  ): Promise<T> {
    let lastError: unknown = null;

    for (let attempt = 1; attempt <= config.retries + 1; attempt++) {
      try {
        const result = await task(attempt);
        if (attempt <= config.retries && shouldRetry(result, null)) {
          LoggerEngine.info(`${config.label}: retrying attempt ${attempt + 1}`);
          await this.sleep(config.delayMs);
          continue;
        }
        return result;
      } catch (error) {
        lastError = error;
        if (attempt > config.retries || !shouldRetry(undefined, error)) {
          throw error;
        }
        LoggerEngine.error(`${config.label}: retrying after failure on attempt ${attempt}`, error);
        await this.sleep(config.delayMs);
      }
    }

    throw lastError;
  }

  private static async sleep(ms: number): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, ms));
  }
}

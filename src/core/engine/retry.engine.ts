import { LoggerEngine } from "./logger.engine";

type RetryableTask<T> = (attempt: number) => Promise<T>;
type ShouldRetry<T> = (result: T | undefined, error: unknown) => boolean;

export type RetryConfig<T> = {
  retries: number;
  delayMs: number | ((failedAttempt: number, result?: T) => number);
  label: string;
  onRetry?: (info: {
    failedAttempt: number;
    nextAttempt: number;
    result?: T;
    error?: unknown;
  }) => void | Promise<void>;
};

export class RetryEngine {
  static async execute<T>(
    task: RetryableTask<T>,
    shouldRetry: ShouldRetry<T>,
    config: RetryConfig<T>,
  ): Promise<T> {
    let lastError: unknown = null;

    for (let attempt = 1; attempt <= config.retries + 1; attempt++) {
      try {
        const result = await task(attempt);
        if (attempt <= config.retries && shouldRetry(result, null)) {
          const delay =
            typeof config.delayMs === "function" ? config.delayMs(attempt, result) : config.delayMs;
          await config.onRetry?.({
            failedAttempt: attempt,
            nextAttempt: attempt + 1,
            result,
          });
          LoggerEngine.warn(`${config.label}: retrying attempt ${attempt + 1} after ${delay}ms`);
          await this.sleep(delay);
          continue;
        }
        return result;
      } catch (error) {
        lastError = error;
        if (attempt > config.retries || !shouldRetry(undefined, error)) {
          throw error;
        }
        const delay =
          typeof config.delayMs === "function"
            ? config.delayMs(attempt, undefined)
            : config.delayMs;
        await config.onRetry?.({
          failedAttempt: attempt,
          nextAttempt: attempt + 1,
          error,
        });
        LoggerEngine.warn(
          `${config.label}: retrying attempt ${attempt + 1} after error (${delay}ms)`,
        );
        await this.sleep(delay);
      }
    }

    throw lastError;
  }

  private static async sleep(ms: number): Promise<void> {
    if (ms <= 0) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, ms));
  }
}

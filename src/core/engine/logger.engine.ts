import fs from "fs";
import path from "path";

type LogLevel = "INFO" | "ERROR" | "API";

export class LoggerEngine {
  private static readonly logDir = path.join(process.cwd(), "logs");
  private static readonly logFile = path.join(LoggerEngine.logDir, "api.log");

  private static ensureLogDir(): void {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  private static write(level: LogLevel, message: string): void {
    this.ensureLogDir();
    const timestamp = new Date().toISOString();
    const line = `[${timestamp}] [${level}] ${message}\n`;
    fs.appendFileSync(this.logFile, line, "utf8");
  }

  static info(message: string): void {
    this.write("INFO", message);
  }

  static error(message: string, error?: unknown): void {
    const errorMessage =
      error instanceof Error ? `${error.message}\n${error.stack ?? ""}` : String(error ?? "");
    this.write("ERROR", error ? `${message} | ${errorMessage}` : message);
  }

  static api(args: {
    method: string;
    url: string;
    status: number;
    responseTimeMs: number;
    attempt?: number;
  }): void {
    const attemptText = args.attempt ? ` attempt=${args.attempt}` : "";
    this.write(
      "API",
      `${args.method.toUpperCase()} ${args.url} status=${args.status} time=${args.responseTimeMs}ms${attemptText}`
    );
  }
}

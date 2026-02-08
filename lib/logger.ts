type LogLevel = "info" | "warn" | "error" | "debug";

function formatMessage(level: LogLevel, message: string, meta?: Record<string, unknown>): string {
  const payload = {
    level,
    message,
    ...meta,
    timestamp: new Date().toISOString(),
  };
  return JSON.stringify(payload);
}

function log(level: LogLevel, message: string, meta?: Record<string, unknown>): void {
  const out = formatMessage(level, message, meta);
  if (level === "error") {
    console.error(out);
  } else if (level === "warn") {
    console.warn(out);
  } else {
    console.log(out);
  }
}

export const logger = {
  info: (message: string, meta?: Record<string, unknown>) => log("info", message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => log("warn", message, meta),
  error: (message: string, meta?: Record<string, unknown>) => log("error", message, meta),
  debug: (message: string, meta?: Record<string, unknown>) => log("debug", message, meta),
};

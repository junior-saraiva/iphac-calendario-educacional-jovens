type LogLevel = "info" | "warn" | "error";

interface LogEntry {
  id: string;
  ts: string; // ISO
  level: LogLevel;
  source: string; // feature/page
  message: string;
  meta?: Record<string, any>;
}

const KEY = "app_logs_v1";

export function logEvent(level: LogLevel, source: string, message: string, meta?: Record<string, any>) {
  const entry: LogEntry = {
    id: crypto.randomUUID(),
    ts: new Date().toISOString(),
    level,
    source,
    message,
    meta,
  };
  const existing = getLogs();
  existing.unshift(entry);
  localStorage.setItem(KEY, JSON.stringify(existing.slice(0, 500))); // keep last 500
}

export function getLogs(): LogEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as LogEntry[]) : [];
  } catch {
    return [];
  }
}

export function clearLogs() {
  localStorage.removeItem(KEY);
}

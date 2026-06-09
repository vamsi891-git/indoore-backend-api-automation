/** IST offset (+05:30) per HES-MDM Integration doc §3 */
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

/** Format: yyyy-mm-ddTHH:MM:SS+5:30 */
export function formatHesDateTime(date: Date): string {
  const ist = new Date(date.getTime() + IST_OFFSET_MS);
  const yyyy = ist.getUTCFullYear();
  const mm = pad(ist.getUTCMonth() + 1);
  const dd = pad(ist.getUTCDate());
  const hh = pad(ist.getUTCHours());
  const min = pad(ist.getUTCMinutes());
  const ss = pad(ist.getUTCSeconds());
  return `${yyyy}-${mm}-${dd}T${hh}:${min}:${ss}+5:30`;
}

/** Default job timeout — 30 minutes from now (IST). */
export function defaultJobTimeoutTime(): string {
  const timeout = new Date();
  timeout.setMinutes(timeout.getMinutes() + 30);
  return formatHesDateTime(timeout);
}

export function isValidHesDateTime(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+5:30$/.test(value);
}

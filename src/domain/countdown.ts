const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

/** A calendar date as `YYYY-MM-DD`, with no time and no zone, which is what providers give for air dates. */
export type DateString = string;

const DAY_MS = 86_400_000;

function toDay(d: DateString): number {
  const [y, m, day] = d.split("-").map(Number);
  return Date.UTC(y ?? 1970, (m ?? 1) - 1, day ?? 1) / DAY_MS;
}

export const daysUntil = (airDate: DateString, today: DateString): number => toDay(airDate) - toDay(today);

/** The text under a caught-up series. Null once the date has passed or when there is none. */
export function countdownLabel(airDate: DateString | null, today: DateString): string | null {
  if (!airDate) return null;
  const days = daysUntil(airDate, today);
  if (days < 0) return null;
  if (days === 0) return "New episode today";
  if (days === 1) return "Next in 1 day";
  if (days <= 45) return `Next in ${days} days`;
  const [, m, d] = airDate.split("-").map(Number);
  return `Next on ${d} ${MONTHS[(m ?? 1) - 1]}`;
}

/** The weekday and date shown in the drawer, such as `Thu 23 Oct`. */
export function airDateLabel(airDate: DateString): string {
  const [y, m, d] = airDate.split("-").map(Number);
  const weekday = new Date(Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1)).getUTCDay();
  return `${["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][weekday]} ${d} ${MONTHS[(m ?? 1) - 1]}`;
}

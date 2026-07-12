/**
 * Format an ISO date string as a human-readable date.
 * @param iso - ISO 8601 date string (e.g. "2026-01-15")
 * @returns Formatted string, e.g. "Jan 15, 2026"
 */
export function formatISODate(iso: string): string {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'UTC',
    });
  } catch {
    return iso;
  }
}

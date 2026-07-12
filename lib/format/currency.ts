/**
 * Format centavos as a Philippine Peso string.
 * @param centavos - Amount in centavos (integer).
 * @param opts.sign - If true, prefix with + or - sign.
 * @returns Formatted string, e.g. "₱1,234.56" or "-₱100.00"
 */
export function formatCentavos(
  centavos: number,
  opts: { sign?: boolean } = {}
): string {
  const isNegative = centavos < 0;
  const absValue = Math.abs(centavos) / 100;
  const formattedNum = absValue.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const prefix = opts.sign
    ? (isNegative ? '-' : '+')
    : (isNegative ? '-' : '');
  return `${prefix}₱${formattedNum}`;
}

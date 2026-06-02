/**
 * Entry fees are always stored and shown in euros, independent of UI language.
 */
export function formatEntryFeeEuro(amount: number): string {
  if (!Number.isFinite(amount) || amount <= 0) {
    return "";
  }

  const hasFraction = Math.abs(amount % 1) > Number.EPSILON;
  const formatted = hasFraction
    ? amount.toLocaleString("en-IE", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : String(Math.round(amount));

  return `€${formatted}`;
}

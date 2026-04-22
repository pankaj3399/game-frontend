export const DEFAULT_TIME_ZONE = "UTC";

export function isValidIanaTimeZone(value: string | null | undefined): value is string {
  if (!value) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

export function getClientTimeZone(): string {
  const resolved = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return isValidIanaTimeZone(resolved) ? resolved : DEFAULT_TIME_ZONE;
}

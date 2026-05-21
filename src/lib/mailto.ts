/**
 * Builds a mailto: href with body/subject line breaks that open correctly in Gmail,
 * Outlook, and native mail clients (CRLF + application/x-www-form-urlencoded).
 */
export function buildMailtoHref(options: {
  baseMailto: string;
  subject: string;
  body: string;
}): string {
  const params = new URLSearchParams();
  params.set("subject", options.subject);
  params.set("body", options.body.replace(/\r\n/g, "\n").replace(/\n/g, "\r\n"));
  const query = params.toString().replace(/\+/g, "%20");
  return `${options.baseMailto}?${query}`;
}

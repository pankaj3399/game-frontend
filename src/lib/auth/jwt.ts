import { z } from "zod";

/**
 * Decodes the payload of a JWT without verification (for display only).
 * The backend verifies the token; this is only for UX (e.g. showing email).
 * Use a schema to get a type-safe result.
 */
export function decodeJwtPayload<T>(token: string, schema: z.ZodType<T>): T {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Invalid token format");
  const payload = parts[1];
  const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - base64.length % 4) % 4), "=");
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  const json = new TextDecoder("utf-8").decode(bytes);
  const parsed: unknown = JSON.parse(json);
  return schema.parse(parsed);
}

export const pendingSignupPayloadSchema = z.object({
  pendingEmail: z.string(),
  pendingSignup: z.literal(true),
  appleId: z.string().optional(),
  googleId: z.string().optional(),
  requiresEmailInput: z.boolean().optional(),
});

export type PendingSignupPayload = z.infer<typeof pendingSignupPayloadSchema>;

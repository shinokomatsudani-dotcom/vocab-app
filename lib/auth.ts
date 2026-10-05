import { createHmac, timingSafeEqual } from "crypto";

export const AUTH_COOKIE = "vocab_session";

function getSecret(): string {
  const secret = process.env.VOCAB_AUTH_SECRET;
  if (!secret) throw new Error("VOCAB_AUTH_SECRET is not set");
  return secret;
}

export function checkPassword(input: string): boolean {
  const password = process.env.VOCAB_PASSWORD;
  if (!password) throw new Error("VOCAB_PASSWORD is not set");
  return safeEqual(input, password);
}

export function signSession(): string {
  return createHmac("sha256", getSecret()).update("authenticated").digest("hex");
}

export function isValidSession(value: string | undefined): boolean {
  if (!value) return false;
  return safeEqual(value, signSession());
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

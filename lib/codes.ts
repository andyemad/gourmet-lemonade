import { kv } from "./kv";
import type { AccessCode } from "./types";

const CODE_LENGTH = 6;
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no confusing chars (0/O, 1/I)

function generateCode(): string {
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
}

export async function generateCodes(count: number): Promise<string[]> {
  const codes: string[] = [];
  const batch = kv.pipeline();

  for (let i = 0; i < count; i++) {
    const code = generateCode();
    codes.push(code);
    const entry: AccessCode = {
      code,
      used: false,
      usedAt: null,
      createdAt: Date.now(),
    };
    batch.set(`code:${code}`, entry);
    batch.sadd("codes", code);
  }

  await batch.exec();
  return codes;
}

export async function validateCode(code: string): Promise<{
  valid: boolean;
  reason?: string;
}> {
  const normalized = code.toUpperCase().trim();

  if (normalized.length !== CODE_LENGTH) {
    return { valid: false, reason: "Code must be 6 characters" };
  }

  const entry = await kv.get(`code:${normalized}`) as AccessCode | null;

  if (!entry) {
    return { valid: false, reason: "Invalid code" };
  }

  if (entry.used) {
    return { valid: false, reason: "Code already used" };
  }

  // Mark as used
  entry.used = true;
  entry.usedAt = Date.now();
  await kv.set(`code:${entry.code}`, entry);

  return { valid: true };
}

export async function getCodeStats(): Promise<{
  total: number;
  used: number;
  remaining: number;
}> {
  const allCodes = await kv.smembers("codes");
  if (!allCodes.length) return { total: 0, used: 0, remaining: 0 };

  const entries = await Promise.all(
    (allCodes as string[]).map((code) => kv.get(`code:${code}`) as Promise<AccessCode | null>)
  );

  const total = entries.length;
  const used = entries.filter((e) => e?.used).length;

  return { total, used, remaining: total - used };
}

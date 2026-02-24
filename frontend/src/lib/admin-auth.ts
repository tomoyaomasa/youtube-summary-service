import { SignJWT, jwtVerify } from "jose";

const JWT_SECRET = process.env.ADMIN_JWT_SECRET || "dev-jwt-secret-change-in-production-64chars";
const TOTP_SECRET = process.env.ADMIN_TOTP_SECRET || "";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";

const encoder = new TextEncoder();

// ========================================
// JWT
// ========================================

export async function createAdminToken(): Promise<string> {
  const secret = encoder.encode(JWT_SECRET);
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("2h")
    .sign(secret);
}

export async function verifyAdminToken(token: string): Promise<boolean> {
  try {
    const secret = encoder.encode(JWT_SECRET);
    await jwtVerify(token, secret);
    return true;
  } catch {
    return false;
  }
}

// ========================================
// Rate Limiting (in-memory)
// ========================================

interface LoginAttempt {
  count: number;
  lastAttemptAt: number;
  lockedUntil: number;
}

const loginAttempts = new Map<string, LoginAttempt>();

const MAX_ATTEMPTS = 5;
const LOCK_DURATION_MS = 30 * 60 * 1000; // 30 minutes

export function checkRateLimit(ip: string): { allowed: boolean; remainingMinutes?: number } {
  const now = Date.now();
  const attempt = loginAttempts.get(ip);

  if (!attempt) return { allowed: true };

  if (attempt.lockedUntil > now) {
    const remainingMinutes = Math.ceil((attempt.lockedUntil - now) / 60000);
    return { allowed: false, remainingMinutes };
  }

  // Reset if lock expired
  if (attempt.lockedUntil > 0 && attempt.lockedUntil <= now) {
    loginAttempts.delete(ip);
    return { allowed: true };
  }

  return { allowed: true };
}

export function recordFailedAttempt(ip: string): void {
  const now = Date.now();
  const attempt = loginAttempts.get(ip) || { count: 0, lastAttemptAt: 0, lockedUntil: 0 };

  attempt.count += 1;
  attempt.lastAttemptAt = now;

  if (attempt.count >= MAX_ATTEMPTS) {
    attempt.lockedUntil = now + LOCK_DURATION_MS;
  }

  loginAttempts.set(ip, attempt);
}

export function resetAttempts(ip: string): void {
  loginAttempts.delete(ip);
}

// ========================================
// Password & TOTP
// ========================================

export function verifyPassword(password: string): boolean {
  return ADMIN_PASSWORD !== "" && password === ADMIN_PASSWORD;
}

export function getTotpSecret(): string {
  return TOTP_SECRET;
}

export async function verifyTotp(token: string): Promise<boolean> {
  if (!TOTP_SECRET) return true; // Skip TOTP if not configured

  const otplib = await import("otplib");
  try {
    const result = await otplib.verify({ token, secret: TOTP_SECRET });
    return typeof result === "object" && result !== null && "valid" in result
      ? (result as { valid: boolean }).valid
      : result === true;
  } catch {
    return false;
  }
}

export async function generateTotpUri(): Promise<string> {
  if (!TOTP_SECRET) return "";
  const otplib = await import("otplib");
  return otplib.generateURI({ secret: TOTP_SECRET, issuer: "YouTube要約管理", label: "admin" });
}

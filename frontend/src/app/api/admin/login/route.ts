import { NextRequest, NextResponse } from "next/server";
import {
  checkRateLimit,
  recordFailedAttempt,
  resetAttempts,
  verifyPassword,
  verifyTotp,
  createAdminToken,
  getTotpSecret,
} from "@/lib/admin-auth";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

  // Rate limit check
  const rateCheck = checkRateLimit(ip);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: `ログインがブロックされています。${rateCheck.remainingMinutes}分後に再試行してください。` },
      { status: 429 }
    );
  }

  const body = await request.json();
  const { password, totpCode } = body;

  // Step 1: Password verification
  if (!verifyPassword(password)) {
    recordFailedAttempt(ip);
    return NextResponse.json({ error: "パスワードが正しくありません" }, { status: 401 });
  }

  // Step 2: TOTP verification (if configured)
  const totpSecret = getTotpSecret();
  if (totpSecret) {
    if (!totpCode) {
      return NextResponse.json({ requireTotp: true }, { status: 200 });
    }
    const totpValid = await verifyTotp(totpCode);
    if (!totpValid) {
      recordFailedAttempt(ip);
      return NextResponse.json({ error: "認証コードが正しくありません" }, { status: 401 });
    }
  }

  // Success
  resetAttempts(ip);
  const token = await createAdminToken();

  return NextResponse.json({ token });
}

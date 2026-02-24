import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken, generateTotpUri, getTotpSecret } from "@/lib/admin-auth";
import QRCode from "qrcode";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { token } = body;

  // Require valid admin session
  if (!token || !(await verifyAdminToken(token))) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const secret = getTotpSecret();
  if (!secret) {
    return NextResponse.json(
      { error: "ADMIN_TOTP_SECRETが設定されていません" },
      { status: 400 }
    );
  }

  const otpauthUri = await generateTotpUri();
  const qrCodeDataUrl = await QRCode.toDataURL(otpauthUri);

  return NextResponse.json({ qrCode: qrCodeDataUrl, secret });
}

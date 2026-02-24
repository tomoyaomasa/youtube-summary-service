import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken } from "@/lib/admin-auth";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { token } = body;

  if (!token) {
    return NextResponse.json({ valid: false }, { status: 401 });
  }

  const valid = await verifyAdminToken(token);
  return NextResponse.json({ valid }, { status: valid ? 200 : 401 });
}

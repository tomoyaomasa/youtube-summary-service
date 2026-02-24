"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import AdminHeader from "@/components/admin-header";
import Image from "next/image";

export default function AdminSetupPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function checkAuth() {
      const token = sessionStorage.getItem("admin_token");
      if (!token) {
        router.push("/admin");
        return;
      }
      try {
        const res = await fetch("/api/admin/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = await res.json();
        if (!data.valid) {
          router.push("/admin");
          return;
        }
        setIsAuthenticated(true);
      } catch {
        router.push("/admin");
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, [router]);

  async function handleGenerateQR() {
    setError("");
    const token = sessionStorage.getItem("admin_token");
    try {
      const res = await fetch("/api/admin/setup-totp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setQrCode(data.qrCode);
        setSecret(data.secret);
      }
    } catch {
      setError("QRコードの生成に失敗しました");
    }
  }

  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <p className="text-zinc-500">読み込み中...</p>
      </div>
    );
  }

  return (
    <>
      <AdminHeader />
      <div className="container mx-auto px-4 py-8 max-w-lg">
        <h1 className="text-2xl font-bold mb-6">TOTP認証セットアップ</h1>

        <Card>
          <CardContent className="p-6 space-y-4">
            <p className="text-sm text-zinc-600">
              Google AuthenticatorやAuthyなどの認証アプリを使って、二要素認証を設定します。
            </p>

            <ol className="text-sm space-y-2 list-decimal list-inside text-zinc-600">
              <li>環境変数 <code className="bg-zinc-100 px-1 rounded">ADMIN_TOTP_SECRET</code> にBase32のシークレットキーを設定</li>
              <li>下のボタンでQRコードを生成</li>
              <li>認証アプリでQRコードを読み取り</li>
              <li>次回ログイン時から6桁コードが必要になります</li>
            </ol>

            {!qrCode ? (
              <>
                <Button onClick={handleGenerateQR} className="w-full">
                  QRコードを表示する
                </Button>
                {error && <p className="text-sm text-red-600">{error}</p>}
              </>
            ) : (
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <Image src={qrCode} alt="TOTP QR Code" width={200} height={200} />
                </div>
                <div className="bg-zinc-100 p-3 rounded">
                  <p className="text-xs text-zinc-500 mb-1">手動入力用シークレット:</p>
                  <code className="text-sm font-mono break-all">{secret}</code>
                </div>
                <p className="text-xs text-zinc-500">
                  このQRコードを認証アプリでスキャンしてください。
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-4">
          <Button variant="ghost" onClick={() => router.push("/admin")} className="text-sm">
            ← ダッシュボードに戻る
          </Button>
        </div>
      </div>
    </>
  );
}

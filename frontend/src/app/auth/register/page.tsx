"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { register, confirmRegistration, login } from "@/lib/auth";
import { useAuth } from "@/components/auth-provider";
import { submitRequest } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

export default function RegisterPage() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [step, setStep] = useState<"register" | "confirm">("register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [requestedChannel, setRequestedChannel] = useState("");
  const [emailNotification, setEmailNotification] = useState(true);
  const [confirmCode, setConfirmCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await register(email, password);
      setStep("confirm");
    } catch (err) {
      setError(err instanceof Error ? err.message : "登録に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await confirmRegistration(email, confirmCode);

      // ログインしてユーザー情報を取得
      await login(email, password);
      await refreshUser();

      // 希望チャンネルがあればリクエストを送信
      if (requestedChannel.trim()) {
        try {
          await submitRequest({
            channelName: requestedChannel.trim(),
            channelUrl: "",
            requesterEmail: email,
            message: "新規登録時のリクエスト",
          });
        } catch {
          // リクエスト送信失敗はスキップ
        }
      }

      // チャンネル一覧ページへリダイレクト
      router.push("/channels");
    } catch (err) {
      setError(err instanceof Error ? err.message : "確認に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {step === "register" ? (
          <>
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold mb-2">
                無料登録して、要約を受け取ろう
              </h1>
              <p className="text-sm text-zinc-500">
                登録後、気になるチャンネルを選ぶだけで
                <br />
                新着動画の要約がメールで届きます。
              </p>
            </div>
            <Card>
              <CardContent className="p-6">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      メールアドレス <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      パスワード <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="8文字以上（英小文字+数字）"
                      minLength={8}
                      required
                    />
                  </div>

                  <div className="border-t pt-4">
                    <label className="block text-sm font-medium mb-1">
                      要約を受け取りたいチャンネル名
                      <span className="text-xs text-zinc-400 ml-1">（任意）</span>
                    </label>
                    <Input
                      type="text"
                      value={requestedChannel}
                      onChange={(e) => setRequestedChannel(e.target.value)}
                      placeholder="例：マコなり社長、両学長、中田敦彦のYouTube大学"
                    />
                    <p className="text-xs text-zinc-400 mt-1">
                      ※登録後もチャンネルページから自由に追加できます
                    </p>
                  </div>

                  <div className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      id="emailNotification"
                      checked={emailNotification}
                      onChange={(e) => setEmailNotification(e.target.checked)}
                      className="mt-1 rounded"
                    />
                    <div>
                      <label htmlFor="emailNotification" className="text-sm font-medium cursor-pointer">
                        新着動画の要約をメールで受け取る
                      </label>
                      <p className="text-xs text-zinc-400">
                        ※登録後にいつでも変更できます
                      </p>
                    </div>
                  </div>

                  {error && <p className="text-sm text-red-600">{error}</p>}
                  <Button type="submit" className="w-full bg-red-600 hover:bg-red-700" disabled={loading}>
                    {loading ? "登録中..." : "無料で登録する"}
                  </Button>
                </form>
                <p className="text-sm text-center mt-4 text-zinc-500">
                  すでにアカウントをお持ちの方は{" "}
                  <Link href="/auth/login" className="text-red-600 hover:underline">
                    ログイン
                  </Link>
                </p>
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-center mb-6">
              確認コード入力
            </h1>
            <Card>
              <CardContent className="p-6">
                <form onSubmit={handleConfirm} className="space-y-4">
                  <p className="text-sm text-zinc-600">
                    {email} に確認コードを送信しました。
                  </p>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      確認コード
                    </label>
                    <Input
                      type="text"
                      value={confirmCode}
                      onChange={(e) => setConfirmCode(e.target.value)}
                      placeholder="123456"
                      required
                    />
                  </div>
                  {error && <p className="text-sm text-red-600">{error}</p>}
                  <Button type="submit" className="w-full bg-red-600 hover:bg-red-700" disabled={loading}>
                    {loading ? "確認中..." : "確認して始める"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

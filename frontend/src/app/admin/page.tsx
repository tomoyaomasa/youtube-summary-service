"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import AdminHeader from "@/components/admin-header";
import { getVideos, getChannels } from "@/lib/api";
import { Video, Channel } from "@/lib/types";

type LoginStep = "password" | "totp";

export default function AdminPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Login state
  const [loginStep, setLoginStep] = useState<LoginStep>("password");
  const [password, setPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Dashboard state
  const [videos, setVideos] = useState<Video[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [dashLoading, setDashLoading] = useState(true);

  // Check existing session on mount
  useEffect(() => {
    async function checkSession() {
      const token = sessionStorage.getItem("admin_token");
      if (!token) {
        setCheckingAuth(false);
        return;
      }
      try {
        const res = await fetch("/api/admin/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = await res.json();
        if (data.valid) {
          setIsAuthenticated(true);
        } else {
          sessionStorage.removeItem("admin_token");
        }
      } catch {
        sessionStorage.removeItem("admin_token");
      }
      setCheckingAuth(false);
    }
    checkSession();
  }, []);

  // Load dashboard data when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;
    async function loadDashboard() {
      try {
        const [videosRes, channelsRes] = await Promise.all([
          getVideos(100),
          getChannels(),
        ]);
        setVideos(videosRes.items);
        setChannels(channelsRes.items);
      } catch (err) {
        console.error("Dashboard load error:", err);
      } finally {
        setDashLoading(false);
      }
    }
    loadDashboard();
  }, [isAuthenticated]);

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();

      if (res.status === 429) {
        setError(data.error);
      } else if (res.status === 401) {
        setError(data.error);
      } else if (data.requireTotp) {
        setLoginStep("totp");
      } else if (data.token) {
        sessionStorage.setItem("admin_token", data.token);
        setIsAuthenticated(true);
      }
    } catch {
      setError("ログインに失敗しました");
    } finally {
      setLoading(false);
    }
  }

  async function handleTotpSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, totpCode }),
      });
      const data = await res.json();

      if (res.status === 429) {
        setError(data.error);
        setLoginStep("password");
        setPassword("");
        setTotpCode("");
      } else if (res.status === 401) {
        setError(data.error);
        setTotpCode("");
      } else if (data.token) {
        sessionStorage.setItem("admin_token", data.token);
        setIsAuthenticated(true);
      }
    } catch {
      setError("認証に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  // Loading check
  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <p className="text-zinc-500">認証確認中...</p>
      </div>
    );
  }

  // Login form
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 px-4">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-bold mb-6 text-center">管理画面ログイン</h1>

          {loginStep === "password" ? (
            <Card>
              <CardContent className="p-6">
                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">パスワード</label>
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="管理者パスワードを入力"
                      required
                      autoFocus
                    />
                  </div>
                  {error && <p className="text-sm text-red-600">{error}</p>}
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "確認中..." : "次へ"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-6">
                <form onSubmit={handleTotpSubmit} className="space-y-4">
                  <p className="text-sm text-zinc-600 text-center">
                    認証アプリに表示されている6桁のコードを入力してください
                  </p>
                  <div>
                    <label className="block text-sm font-medium mb-1">認証コード</label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={totpCode}
                      onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ""))}
                      placeholder="123456"
                      required
                      autoFocus
                    />
                  </div>
                  {error && <p className="text-sm text-red-600">{error}</p>}
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "確認中..." : "ログイン"}
                  </Button>
                  <button
                    type="button"
                    onClick={() => { setLoginStep("password"); setError(""); setTotpCode(""); }}
                    className="text-xs text-zinc-500 hover:text-zinc-700 w-full text-center"
                  >
                    パスワード入力に戻る
                  </button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  // Dashboard
  const recentVideos = [...videos]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <>
      <AdminHeader />
      <div className="container mx-auto px-4 py-8">
        {/* Main action */}
        <div className="mb-8">
          <Link href="/admin/videos/new">
            <Button size="lg" className="bg-red-600 hover:bg-red-700 text-base px-8">
              動画を登録する
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold">{dashLoading ? "-" : videos.length}</p>
              <p className="text-sm text-zinc-500 mt-1">登録動画数</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold">{dashLoading ? "-" : channels.length}</p>
              <p className="text-sm text-zinc-500 mt-1">登録チャンネル数</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold">-</p>
              <p className="text-sm text-zinc-500 mt-1">登録ユーザー数</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold">-</p>
              <p className="text-sm text-zinc-500 mt-1">未対応リクエスト</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent videos */}
        <h2 className="text-lg font-semibold mb-4">最近登録した動画（直近5件）</h2>
        {dashLoading ? (
          <p className="text-zinc-500 text-sm">読み込み中...</p>
        ) : recentVideos.length === 0 ? (
          <p className="text-zinc-500 text-sm">まだ動画がありません。</p>
        ) : (
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-zinc-50">
                    <th className="text-left px-4 py-3 font-medium">タイトル</th>
                    <th className="text-left px-4 py-3 font-medium">チャンネル</th>
                    <th className="text-left px-4 py-3 font-medium">登録日</th>
                  </tr>
                </thead>
                <tbody>
                  {recentVideos.map((video) => (
                    <tr key={video.videoId} className="border-b last:border-0">
                      <td className="px-4 py-3">
                        <Link
                          href={`/videos/${video.videoId}`}
                          className="text-blue-600 hover:underline"
                        >
                          {video.title}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-zinc-500">{video.channelName}</td>
                      <td className="px-4 py-3 text-zinc-500">
                        {new Date(video.createdAt).toLocaleDateString("ja-JP")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}

        {/* TOTP Setup Link */}
        <div className="mt-8 pt-6 border-t">
          <Link href="/admin/setup" className="text-xs text-zinc-400 hover:text-zinc-600">
            TOTP認証セットアップ
          </Link>
        </div>
      </div>
    </>
  );
}

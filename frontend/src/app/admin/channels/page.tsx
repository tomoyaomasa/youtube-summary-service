"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import AdminHeader from "@/components/admin-header";
import { getChannels, addChannel } from "@/lib/api";
import { Channel } from "@/lib/types";

export default function AdminChannelsPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);

  // Form
  const [channelId, setChannelId] = useState("");
  const [channelName, setChannelName] = useState("");
  const [channelUrl, setChannelUrl] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [category, setCategory] = useState("business");
  const [message, setMessage] = useState("");

  // Auth check
  useEffect(() => {
    async function check() {
      const token = sessionStorage.getItem("admin_token");
      if (!token) { router.push("/admin"); return; }
      try {
        const res = await fetch("/api/admin/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = await res.json();
        if (!data.valid) { router.push("/admin"); return; }
        setIsAuthenticated(true);
      } catch { router.push("/admin"); }
      setCheckingAuth(false);
    }
    check();
  }, [router]);

  async function loadChannels() {
    try {
      const data = await getChannels();
      setChannels(data.items);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isAuthenticated) loadChannels();
  }, [isAuthenticated]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const password = sessionStorage.getItem("admin_password") || "";
      await addChannel(password, { channelId, channelName, channelUrl, category });
      setMessage("チャンネルを追加しました");
      setChannelId("");
      setChannelName("");
      setChannelUrl("");
      setThumbnailUrl("");
      loadChannels();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "追加に失敗しました");
    }
  }

  if (checkingAuth || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <p className="text-zinc-500">認証確認中...</p>
      </div>
    );
  }

  return (
    <>
      <AdminHeader />
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => router.push("/admin")}
          className="text-sm mb-4 -ml-2"
        >
          ← ダッシュボードに戻る
        </Button>

        <h1 className="text-2xl font-bold mb-6">チャンネル管理</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Registration form */}
          <div>
            <h2 className="text-lg font-semibold mb-4">チャンネル登録</h2>
            <Card>
              <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      チャンネルID <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={channelId}
                      onChange={(e) => setChannelId(e.target.value)}
                      placeholder="UCxxxxxxxx"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      チャンネル名 <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={channelName}
                      onChange={(e) => setChannelName(e.target.value)}
                      placeholder="チャンネル名"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      YouTubeチャンネルURL <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="url"
                      value={channelUrl}
                      onChange={(e) => setChannelUrl(e.target.value)}
                      placeholder="https://www.youtube.com/@..."
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      サムネイル画像URL
                    </label>
                    <Input
                      type="url"
                      value={thumbnailUrl}
                      onChange={(e) => setThumbnailUrl(e.target.value)}
                      placeholder="https://..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">カテゴリ</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full border rounded-md px-3 py-2 text-sm"
                    >
                      <option value="business">ビジネス</option>
                      <option value="marketing">マーケティング</option>
                      <option value="finance">ファイナンス</option>
                      <option value="other">その他</option>
                    </select>
                  </div>
                  <Button type="submit" className="w-full">登録する</Button>
                </form>
                {message && (
                  <p className="mt-4 text-sm text-green-600">{message}</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Channel list */}
          <div>
            <h2 className="text-lg font-semibold mb-4">登録済みチャンネル</h2>
            {loading ? (
              <p className="text-zinc-500 text-sm">読み込み中...</p>
            ) : channels.length === 0 ? (
              <p className="text-zinc-500 text-sm">チャンネルがありません</p>
            ) : (
              <div className="space-y-3">
                {channels.map((ch) => (
                  <Card key={ch.channelId}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold">{ch.channelName}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              {ch.category}
                            </Badge>
                            <span className="text-xs text-zinc-500">
                              {ch.videoCount}本
                            </span>
                            <span className="text-xs text-zinc-500">
                              リクエスト: {ch.requestCount}
                            </span>
                          </div>
                        </div>
                        <Badge variant={ch.isActive ? "default" : "secondary"}>
                          {ch.isActive ? "監視ON" : "監視OFF"}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

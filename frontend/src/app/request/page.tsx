"use client";

import { useState } from "react";
import { submitRequest } from "@/lib/api";
import { useAuth } from "@/components/auth-provider";
import LoginPrompt from "@/components/login-prompt";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";

export default function RequestPage() {
  const { user, loading: authLoading } = useAuth();
  const [channelName, setChannelName] = useState("");
  const [channelUrl, setChannelUrl] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    setResult(null);

    try {
      await submitRequest({
        channelName,
        channelUrl,
        requesterEmail: user.email,
        message,
      });
      setResult({ success: true, message: "リクエストを送信しました。" });
      setChannelName("");
      setChannelUrl("");
      setMessage("");
    } catch (error) {
      setResult({
        success: false,
        message: "送信に失敗しました。もう一度お試しください。",
      });
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-xl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-zinc-200 rounded w-1/2" />
          <div className="h-64 bg-zinc-200 rounded" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-xl">
        <h1 className="text-2xl font-bold mb-2">チャンネルリクエスト</h1>
        <p className="text-zinc-500 text-sm mb-6">
          要約してほしいYouTubeチャンネルをリクエストできます。
        </p>
        <div className="relative min-h-[200px]">
          <LoginPrompt />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-xl">
      <h1 className="text-2xl font-bold mb-2">チャンネルリクエスト</h1>
      <p className="text-zinc-500 text-sm mb-6">
        要約してほしいYouTubeチャンネルをリクエストできます。
      </p>

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                YouTubeチャンネル名 <span className="text-red-500">*</span>
              </label>
              <Input
                value={channelName}
                onChange={(e) => setChannelName(e.target.value)}
                placeholder="例: 中田敦彦のYouTube大学"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                チャンネルURL（任意）
              </label>
              <Input
                type="url"
                value={channelUrl}
                onChange={(e) => setChannelUrl(e.target.value)}
                placeholder="https://www.youtube.com/@..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                リクエスト理由（任意・200文字以内）
              </label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="このチャンネルの要約が欲しい理由..."
                rows={3}
                maxLength={200}
              />
              <p className="text-xs text-zinc-400 mt-1 text-right">
                {message.length}/200
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "送信中..." : "リクエストを送信"}
            </Button>
          </form>

          {result && (
            <p
              className={`mt-4 text-sm ${
                result.success ? "text-green-600" : "text-red-600"
              }`}
            >
              {result.message}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

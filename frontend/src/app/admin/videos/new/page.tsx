"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { createVideoSummary, getChannels } from "@/lib/api";
import { Channel } from "@/lib/types";

export default function AdminVideoNewPage() {
  const [password] = useState(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("admin_password") || "";
    }
    return "";
  });

  const [channels, setChannels] = useState<Channel[]>([]);
  const [videoUrl, setVideoUrl] = useState("");
  const [transcript, setTranscript] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{
    videoId: string;
    title: string;
    summary: string;
    keyPoints: string[];
    chapters: unknown[];
    tags: string[];
  } | null>(null);

  // 編集用の状態
  const [editSummary, setEditSummary] = useState("");
  const [editTags, setEditTags] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const data = await getChannels();
        setChannels(data.items);
      } catch (err) {
        console.error(err);
      }
    }
    load();
  }, []);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const data = await createVideoSummary(password, videoUrl, transcript);
      setResult(data);
      setEditSummary(data.summary);
      setEditTags(data.tags.join(", "));
    } catch (err) {
      setError(err instanceof Error ? err.message : "要約の生成に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">動画登録・要約生成</h1>

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                YouTube動画URL <span className="text-red-500">*</span>
              </label>
              <Input
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                required
              />
              <p className="text-xs text-zinc-400 mt-1">
                URLからvideoIdを自動抽出し、メタデータを取得します
              </p>
            </div>

            {channels.length > 0 && (
              <div>
                <label className="block text-sm font-medium mb-1">
                  チャンネル選択
                </label>
                <select className="w-full border rounded-md px-3 py-2 text-sm">
                  <option value="">自動取得</option>
                  {channels.map((ch) => (
                    <option key={ch.channelId} value={ch.channelId}>
                      {ch.channelName}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1">
                字幕テキスト <span className="text-red-500">*</span>
              </label>
              <Textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="YouTube Transcribeなどで取得した字幕テキストを貼り付け..."
                rows={14}
                required
              />
              <p className="text-xs text-zinc-400 mt-1">
                YouTube Transcribeなどで字幕を取得し、ここに貼り付けてください
              </p>
            </div>

            <Button type="submit" disabled={loading} className="w-full" size="lg">
              {loading ? "AIで要約を生成中..." : "AIで要約生成"}
            </Button>
          </form>

          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        </CardContent>
      </Card>

      {/* プレビュー・編集エリア */}
      {result && (
        <Card className="mt-6">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold mb-4">要約プレビュー・編集</h2>

            <div className="space-y-6">
              <div>
                <p className="text-sm font-medium text-zinc-500 mb-1">タイトル</p>
                <p className="font-semibold text-lg">{result.title}</p>
              </div>

              <Separator />

              <div>
                <p className="text-sm font-medium text-zinc-500 mb-1">全体要約（編集可能）</p>
                <Textarea
                  value={editSummary}
                  onChange={(e) => setEditSummary(e.target.value)}
                  rows={6}
                />
              </div>

              <Separator />

              <div>
                <p className="text-sm font-medium text-zinc-500 mb-1">ポイント</p>
                <ul className="list-disc list-inside text-sm space-y-1">
                  {result.keyPoints.map((point, i) => (
                    <li key={i}>{point}</li>
                  ))}
                </ul>
              </div>

              <Separator />

              <div>
                <p className="text-sm font-medium text-zinc-500 mb-1">タグ（カンマ区切りで編集可能）</p>
                <Input
                  value={editTags}
                  onChange={(e) => setEditTags(e.target.value)}
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  {editTags.split(",").map((tag) => tag.trim()).filter(Boolean).map((tag) => (
                    <Badge key={tag} variant="secondary">{tag}</Badge>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="flex gap-3">
                <Button className="flex-1 bg-green-600 hover:bg-green-700">
                  公開する
                </Button>
                <Button variant="outline" className="flex-1">
                  下書き保存
                </Button>
              </div>
            </div>

            <p className="text-green-600 text-sm mt-4">
              要約が生成・保存されました。
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

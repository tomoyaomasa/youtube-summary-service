"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import AdminHeader from "@/components/admin-header";
import { createVideoSummary, getChannels } from "@/lib/api";
import { Channel, Chapter } from "@/lib/types";
import Image from "next/image";

type Step = 1 | 2 | 3;

interface VideoMeta {
  title: string;
  channelName: string;
  publishedAt: string;
  thumbnailUrl: string;
}

interface SummaryResult {
  videoId: string;
  title: string;
  summary: string;
  keyPoints: string[];
  chapters: Chapter[];
  tags: string[];
}

export default function AdminVideoNewPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [step, setStep] = useState<Step>(1);
  const [channels, setChannels] = useState<Channel[]>([]);

  // Step 1
  const [videoUrl, setVideoUrl] = useState("");
  const [videoMeta, setVideoMeta] = useState<VideoMeta | null>(null);
  const [metaLoading, setMetaLoading] = useState(false);

  // Step 2
  const [transcript, setTranscript] = useState("");
  const [generating, setGenerating] = useState(false);

  // Step 3
  const [result, setResult] = useState<SummaryResult | null>(null);
  const [editSummary, setEditSummary] = useState("");
  const [editChapters, setEditChapters] = useState<Chapter[]>([]);
  const [editTags, setEditTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [publishing, setPublishing] = useState(false);

  const [error, setError] = useState("");

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

  // Load channels
  useEffect(() => {
    if (!isAuthenticated) return;
    getChannels().then((d) => setChannels(d.items)).catch(console.error);
  }, [isAuthenticated]);

  // Extract video ID from URL
  function extractVideoId(url: string): string | null {
    const patterns = [
      /[?&]v=([^&]+)/,
      /youtu\.be\/([^?&]+)/,
      /\/embed\/([^?&]+)/,
    ];
    for (const p of patterns) {
      const m = url.match(p);
      if (m) return m[1];
    }
    return null;
  }

  // Step 1: Load video metadata
  async function handleLoadUrl() {
    setError("");
    const videoId = extractVideoId(videoUrl);
    if (!videoId) {
      setError("有効なYouTube URLを入力してください");
      return;
    }
    setMetaLoading(true);
    // Simulate meta extraction (in production, would call YouTube API)
    const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    setVideoMeta({
      title: "",
      channelName: "",
      publishedAt: "",
      thumbnailUrl,
    });
    setMetaLoading(false);
    setStep(2);
  }

  // Step 2: Generate summary
  async function handleGenerate() {
    setError("");
    setGenerating(true);
    try {
      const password = sessionStorage.getItem("admin_password") || "";
      const data = await createVideoSummary(password, videoUrl, transcript);
      const summaryResult: SummaryResult = {
        videoId: data.videoId,
        title: data.title,
        summary: data.summary,
        keyPoints: data.keyPoints,
        chapters: (data.chapters || []) as Chapter[],
        tags: data.tags,
      };
      setResult(summaryResult);
      setEditSummary(summaryResult.summary);
      setEditChapters([...summaryResult.chapters]);
      setEditTags([...summaryResult.tags]);
      setStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : "要約の生成に失敗しました");
    } finally {
      setGenerating(false);
    }
  }

  // Step 3: Edit chapter
  function updateChapter(index: number, field: keyof Chapter, value: string) {
    setEditChapters((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  }

  function addChapter() {
    setEditChapters((prev) => [
      ...prev,
      { startTime: "00:00", chapterTitle: "", chapterSummary: "", youtubeTimestampUrl: "" },
    ]);
  }

  function removeChapter(index: number) {
    setEditChapters((prev) => prev.filter((_, i) => i !== index));
  }

  function addTag() {
    if (newTag.trim() && !editTags.includes(newTag.trim())) {
      setEditTags((prev) => [...prev, newTag.trim()]);
      setNewTag("");
    }
  }

  function removeTag(tag: string) {
    setEditTags((prev) => prev.filter((t) => t !== tag));
  }

  // Publish
  async function handlePublish() {
    setPublishing(true);
    // In production: save to DynamoDB, send notifications
    setTimeout(() => {
      setPublishing(false);
      alert("公開しました");
      router.push("/admin");
    }, 1000);
  }

  // Re-generate
  function handleRegenerate() {
    setStep(2);
    setResult(null);
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
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Button
          variant="ghost"
          onClick={() => router.push("/admin")}
          className="text-sm mb-4 -ml-2"
        >
          ← ダッシュボードに戻る
        </Button>

        <h1 className="text-2xl font-bold mb-6">動画登録・要約生成</h1>

        {/* Step indicators */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  step >= s
                    ? "bg-red-600 text-white"
                    : "bg-zinc-200 text-zinc-400"
                }`}
              >
                {s}
              </div>
              <span
                className={`text-sm ${
                  step >= s ? "text-zinc-800 font-medium" : "text-zinc-400"
                }`}
              >
                {s === 1 ? "URL入力" : s === 2 ? "文字起こし" : "確認・公開"}
              </span>
              {s < 3 && (
                <div className={`w-8 h-0.5 ${step > s ? "bg-red-600" : "bg-zinc-200"}`} />
              )}
            </div>
          ))}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Step 1: URL Input */}
        {step === 1 && (
          <Card>
            <CardContent className="p-6 space-y-4">
              <h2 className="text-lg font-semibold">YouTube動画URLを貼り付けてください</h2>
              <Input
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                autoFocus
              />
              <Button
                onClick={handleLoadUrl}
                disabled={!videoUrl.trim() || metaLoading}
                className="w-full"
                size="lg"
              >
                {metaLoading ? "読み込み中..." : "URLを読み込む"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Transcript Input */}
        {step === 2 && (
          <div className="space-y-4">
            {/* Video preview */}
            {videoMeta && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className="w-40 shrink-0">
                      <Image
                        src={videoMeta.thumbnailUrl}
                        alt="thumbnail"
                        width={160}
                        height={90}
                        className="rounded aspect-video object-cover w-full"
                      />
                    </div>
                    <div className="text-sm text-zinc-600">
                      <p className="font-medium text-zinc-800">{videoUrl}</p>
                      {videoMeta.title && <p className="mt-1">{videoMeta.title}</p>}
                      {videoMeta.channelName && (
                        <p className="text-zinc-500">{videoMeta.channelName}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent className="p-6 space-y-4">
                <h2 className="text-lg font-semibold">
                  文字起こしを貼り付けてください
                </h2>
                <p className="text-sm text-zinc-500">
                  YouTube Transcribeなどで取得した文字起こしをここに貼り付けてください
                </p>
                <Textarea
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  placeholder="文字起こしテキストを貼り付け..."
                  rows={16}
                  className="font-mono text-sm"
                  autoFocus
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-400">
                    文字数：{transcript.length.toLocaleString()}文字
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => { setStep(1); setVideoMeta(null); }}
                    >
                      戻る
                    </Button>
                    <Button
                      onClick={handleGenerate}
                      disabled={!transcript.trim() || generating}
                      size="lg"
                      className="bg-red-600 hover:bg-red-700"
                    >
                      {generating ? "要約を生成中..." : "AIで要約を生成する"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {generating && (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full mx-auto mb-3" />
                <p className="text-zinc-600">要約を生成中です...</p>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Review & Publish */}
        {step === 3 && result && (
          <div className="space-y-4">
            <Card>
              <CardContent className="p-6 space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-zinc-500 mb-1">動画タイトル</h3>
                  <p className="font-semibold text-lg">{result.title}</p>
                </div>

                <Separator />

                {/* Summary */}
                <div>
                  <h3 className="text-sm font-medium text-zinc-500 mb-2">全体要約</h3>
                  <Textarea
                    value={editSummary}
                    onChange={(e) => setEditSummary(e.target.value)}
                    rows={6}
                  />
                </div>

                <Separator />

                {/* Chapters */}
                <div>
                  <h3 className="text-sm font-medium text-zinc-500 mb-2">チャプター別要約</h3>
                  <div className="space-y-3">
                    {editChapters.map((ch, i) => (
                      <div
                        key={i}
                        className="border rounded-lg p-3 space-y-2 bg-zinc-50"
                      >
                        <div className="flex items-center gap-2">
                          <Input
                            value={ch.startTime}
                            onChange={(e) => updateChapter(i, "startTime", e.target.value)}
                            className="w-24"
                            placeholder="00:00"
                          />
                          <Input
                            value={ch.chapterTitle}
                            onChange={(e) => updateChapter(i, "chapterTitle", e.target.value)}
                            className="flex-1"
                            placeholder="チャプタータイトル"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeChapter(i)}
                            className="text-red-500 hover:text-red-700 shrink-0"
                          >
                            削除
                          </Button>
                        </div>
                        <Textarea
                          value={ch.chapterSummary}
                          onChange={(e) => updateChapter(i, "chapterSummary", e.target.value)}
                          rows={2}
                          placeholder="チャプター要約"
                        />
                      </div>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addChapter}
                    className="mt-2"
                  >
                    + チャプターを追加
                  </Button>
                </div>

                <Separator />

                {/* Tags */}
                <div>
                  <h3 className="text-sm font-medium text-zinc-500 mb-2">タグ</h3>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {editTags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="cursor-pointer hover:bg-red-100"
                        onClick={() => removeTag(tag)}
                      >
                        {tag} ×
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="タグを入力"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") { e.preventDefault(); addTag(); }
                      }}
                      className="max-w-xs"
                    />
                    <Button variant="outline" size="sm" onClick={addTag}>
                      追加
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action buttons */}
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleRegenerate} className="flex-1">
                要約を再生成する
              </Button>
              <Button
                onClick={handlePublish}
                disabled={publishing}
                className="flex-1 bg-green-600 hover:bg-green-700"
                size="lg"
              >
                {publishing ? "公開中..." : "公開する"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

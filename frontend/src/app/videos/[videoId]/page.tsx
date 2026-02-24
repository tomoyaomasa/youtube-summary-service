"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Video } from "@/lib/types";
import { getVideo } from "@/lib/api";
import { useAuth } from "@/components/auth-provider";
import LoginPrompt from "@/components/login-prompt";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";

export default function VideoDetailPage() {
  const params = useParams();
  const videoId = params.videoId as string;
  const { user, loading: authLoading } = useAuth();
  const [video, setVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadVideo() {
      try {
        const data = await getVideo(videoId);
        setVideo(data);
      } catch (error) {
        console.error("Failed to load video:", error);
      } finally {
        setLoading(false);
      }
    }
    loadVideo();
  }, [videoId]);

  if (loading || authLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="animate-pulse space-y-4">
          <div className="aspect-video bg-zinc-200 rounded-lg max-w-3xl" />
          <div className="h-8 bg-zinc-200 rounded w-2/3" />
          <div className="h-4 bg-zinc-200 rounded w-1/3" />
          <div className="h-32 bg-zinc-200 rounded" />
        </div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">動画が見つかりません</h1>
        <Link href="/">
          <Button>トップページへ戻る</Button>
        </Link>
      </div>
    );
  }

  // 未ログイン：ログイン誘導
  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="aspect-video mb-6">
          <iframe
            src={`https://www.youtube.com/embed/${video.videoId}`}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full rounded-lg"
          />
        </div>
        <h1 className="text-2xl font-bold mb-2">{video.title}</h1>
        <p className="text-sm text-zinc-600 mb-6">{video.channelName}</p>

        <div className="relative min-h-[300px]">
          <div className="blur-sm pointer-events-none select-none">
            <Card>
              <CardContent className="p-6">
                <p className="leading-relaxed">{video.summary}</p>
              </CardContent>
            </Card>
          </div>
          <LoginPrompt />
        </div>
      </div>
    );
  }

  // ログイン済み：全コンテンツ表示
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="aspect-video mb-6">
        <iframe
          src={`https://www.youtube.com/embed/${video.videoId}`}
          title={video.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full rounded-lg"
        />
      </div>

      <h1 className="text-2xl font-bold mb-2">{video.title}</h1>
      <div className="flex items-center gap-3 mb-4">
        <Link
          href={`/channels/${video.channelId}`}
          className="text-sm text-zinc-600 hover:text-red-600"
        >
          {video.channelName}
        </Link>
        <span className="text-sm text-zinc-400">
          {new Date(video.publishedAt).toLocaleDateString("ja-JP")}
        </span>
      </div>

      {video.tags && video.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {video.tags.map((tag) => (
            <Badge key={tag} variant="secondary">{tag}</Badge>
          ))}
        </div>
      )}

      <Separator className="my-6" />

      <section className="mb-8">
        <h2 className="text-xl font-bold mb-4">要約</h2>
        <Card>
          <CardContent className="p-6">
            <p className="leading-relaxed">{video.summary}</p>
          </CardContent>
        </Card>
      </section>

      {video.keyPoints && video.keyPoints.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-bold mb-4">ポイント</h2>
          <ul className="space-y-2">
            {video.keyPoints.map((point, i) => (
              <li key={i} className="flex gap-3">
                <span className="text-red-500 font-bold shrink-0">{i + 1}.</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {video.chapters && video.chapters.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-bold mb-4">チャプター別要約</h2>
          <div className="space-y-4">
            {video.chapters.map((chapter, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <a
                      href={chapter.youtubeTimestampUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-mono text-red-600 hover:underline shrink-0"
                    >
                      {chapter.startTime}
                    </a>
                    <h3 className="font-semibold">{chapter.chapterTitle}</h3>
                  </div>
                  <p className="text-sm text-zinc-600 leading-relaxed">
                    {chapter.chapterSummary}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      <div className="text-center mb-8">
        <a href={video.videoUrl} target="_blank" rel="noopener noreferrer">
          <Button size="lg" className="bg-red-600 hover:bg-red-700">
            この動画をYouTubeで見る
          </Button>
        </a>
      </div>

      <Separator className="my-6" />

      <div className="text-xs text-zinc-400 space-y-1">
        <p>
          本要約は著作権法第32条に基づく引用の範囲内で作成されています。元動画の視聴促進を目的としており、内容の正確性を保証するものではありません。削除依頼は
          <Link href="/contact" className="underline">お問い合わせ</Link>まで。
        </p>
        <p>※AIによる要約です。内容の正確性は元動画でご確認ください。</p>
      </div>
    </div>
  );
}

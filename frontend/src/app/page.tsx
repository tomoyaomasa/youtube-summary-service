"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Video, Channel } from "@/lib/types";
import { getVideos, getChannels } from "@/lib/api";
import VideoCard from "@/components/video-card";
import { useAuth } from "@/components/auth-provider";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function HomePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [videos, setVideos] = useState<Video[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [videosRes, channelsRes] = await Promise.all([
          getVideos(12),
          getChannels(),
        ]);
        setVideos(videosRes.items);
        setChannels(channelsRes.items);
      } catch (error) {
        console.error("Failed to load data:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  function handleVideoClick(videoId: string) {
    if (!user) {
      router.push("/auth/login");
    } else {
      router.push(`/videos/${videoId}`);
    }
  }

  return (
    <div>
      {/* ヒーローセクション */}
      {!user && (
        <section className="bg-gradient-to-b from-red-50 to-white py-16 md:py-24">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
              好きなYouTuberの要約が、
              <br className="hidden md:block" />
              自動でメールに届く
            </h1>
            <p className="text-lg text-zinc-600 max-w-2xl mx-auto mb-8">
              チャンネルを登録するだけで、新しい動画の要約をお知らせ。
              <br className="hidden md:block" />
              過去動画の要約もまとめて読めます。
            </p>

            {/* 3つの特徴 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto mb-10">
              <div className="flex flex-col items-center gap-2">
                <span className="text-4xl">📧</span>
                <p className="font-semibold">自動メール通知</p>
                <p className="text-sm text-zinc-500">新着動画の要約をメールでお届け</p>
              </div>
              <div className="flex flex-col items-center gap-2">
                <span className="text-4xl">📺</span>
                <p className="font-semibold">チャンネル登録</p>
                <p className="text-sm text-zinc-500">気になるYouTuberを登録するだけ</p>
              </div>
              <div className="flex flex-col items-center gap-2">
                <span className="text-4xl">📚</span>
                <p className="font-semibold">過去動画も一覧で</p>
                <p className="text-sm text-zinc-500">まとめて読んで一気にキャッチアップ</p>
              </div>
            </div>

            {/* CTAボタン */}
            <div className="flex gap-4 justify-center">
              <Link href="/auth/register">
                <Button size="lg" className="bg-red-600 hover:bg-red-700 text-base px-8">
                  無料で始める
                </Button>
              </Link>
              <Link href="/channels">
                <Button size="lg" variant="outline" className="text-base px-8">
                  チャンネル一覧を見る
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* 使い方ステップ */}
      {!user && (
        <section className="py-12 bg-zinc-50">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold text-center mb-10">こんな使い方ができます</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 font-bold text-xl flex items-center justify-center mx-auto mb-3">1</div>
                <p className="font-semibold mb-1">チャンネルを選ぶ</p>
                <p className="text-sm text-zinc-500">気になるYouTuberのチャンネルを登録</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 font-bold text-xl flex items-center justify-center mx-auto mb-3">2</div>
                <p className="font-semibold mb-1">要約がメールで届く</p>
                <p className="text-sm text-zinc-500">新着動画の要約が自動でメールに届く</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 font-bold text-xl flex items-center justify-center mx-auto mb-3">3</div>
                <p className="font-semibold mb-1">気になったら視聴</p>
                <p className="text-sm text-zinc-500">要約を読んで興味があれば動画を視聴</p>
              </div>
            </div>
          </div>
        </section>
      )}

      <div className="container mx-auto px-4 py-8">
        {/* 最新要約一覧 */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">最新の要約</h2>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-zinc-200 aspect-video rounded-lg" />
                  <div className="mt-3 h-4 bg-zinc-200 rounded w-3/4" />
                  <div className="mt-2 h-3 bg-zinc-200 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : videos.length === 0 ? (
            <p className="text-zinc-500">まだ要約がありません。</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {videos.map((video) => (
                <div
                  key={video.videoId}
                  onClick={() => handleVideoClick(video.videoId)}
                  className="cursor-pointer"
                >
                  <VideoCard video={video} />
                </div>
              ))}
            </div>
          )}
        </section>

        {/* チャンネル一覧 */}
        {!loading && channels.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold mb-6">チャンネル一覧</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {channels.map((channel) => (
                <Link
                  key={channel.channelId}
                  href={`/channels/${channel.channelId}`}
                >
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4 text-center">
                      <p className="font-semibold text-sm">
                        {channel.channelName}
                      </p>
                      <p className="text-xs text-zinc-500 mt-1">
                        {channel.videoCount}本の要約
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

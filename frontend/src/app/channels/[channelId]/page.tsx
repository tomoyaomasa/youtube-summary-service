"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Video, Channel } from "@/lib/types";
import {
  getChannel,
  getVideosByChannel,
  subscribe,
  unsubscribe,
  getSubscriptions,
} from "@/lib/api";
import { useAuth } from "@/components/auth-provider";
import VideoCard from "@/components/video-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function ChannelPage() {
  const params = useParams();
  const router = useRouter();
  const channelId = params.channelId as string;
  const { user } = useAuth();

  const [channel, setChannel] = useState<Channel | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subLoading, setSubLoading] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [channelData, videosData] = await Promise.all([
          getChannel(channelId),
          getVideosByChannel(channelId),
        ]);
        setChannel(channelData);
        setVideos(videosData.items);

        if (user) {
          const subs = await getSubscriptions(user.userId);
          setIsSubscribed(subs.items.some((s: { channelId: string }) => s.channelId === channelId));
        }
      } catch (error) {
        console.error("Failed to load channel data:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [channelId, user]);

  async function handleToggleSubscribe() {
    if (!user) return;
    setSubLoading(true);
    try {
      if (isSubscribed) {
        await unsubscribe(channelId, user.userId);
        setIsSubscribed(false);
      } else {
        await subscribe(channelId, user.userId, user.email);
        setIsSubscribed(true);
      }
    } catch (error) {
      console.error("Subscription toggle failed:", error);
    } finally {
      setSubLoading(false);
    }
  }

  function handleVideoClick(videoId: string) {
    if (!user) {
      router.push("/auth/login");
    } else {
      router.push(`/videos/${videoId}`);
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-zinc-200 rounded w-1/3" />
          <div className="h-4 bg-zinc-200 rounded w-1/4" />
        </div>
      </div>
    );
  }

  if (!channel) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold">チャンネルが見つかりません</h1>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-2">{channel.channelName}</h1>
          <p className="text-zinc-500 text-sm">
            カテゴリ: {channel.category} / {channel.videoCount}本の要約
          </p>
          {channel.channelUrl && (
            <a
              href={channel.channelUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-red-600 hover:underline"
            >
              YouTubeチャンネルを見る →
            </a>
          )}
        </div>

        {user && (
          <Button
            onClick={handleToggleSubscribe}
            disabled={subLoading}
            variant={isSubscribed ? "outline" : "default"}
          >
            {subLoading
              ? "処理中..."
              : isSubscribed
              ? "通知を解除"
              : "通知を受け取る"}
          </Button>
        )}
      </div>

      <Separator className="my-6" />

      <h2 className="text-xl font-bold mb-6">要約済み動画</h2>
      {videos.length === 0 ? (
        <p className="text-zinc-500">
          このチャンネルの要約はまだありません。
        </p>
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
    </div>
  );
}

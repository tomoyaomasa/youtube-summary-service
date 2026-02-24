"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Video, Channel } from "@/lib/types";
import { getVideos, getChannels } from "@/lib/api";
import VideoCard from "@/components/video-card";
import { useAuth } from "@/components/auth-provider";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

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

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-zinc-200 aspect-video rounded-lg" />
              <div className="mt-3 h-4 bg-zinc-200 rounded w-3/4" />
              <div className="mt-2 h-3 bg-zinc-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">最新の要約</h2>
        {videos.length === 0 ? (
          <p className="text-zinc-500">
            まだ要約がありません。
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
      </section>

      {channels.length > 0 && (
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
  );
}

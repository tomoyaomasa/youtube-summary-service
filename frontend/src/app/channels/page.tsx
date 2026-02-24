"use client";

import { useEffect, useState } from "react";
import { Channel } from "@/lib/types";
import { getChannels } from "@/lib/api";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function ChannelsPage() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadChannels() {
      try {
        const data = await getChannels();
        setChannels(data.items);
      } catch (error) {
        console.error("Failed to load channels:", error);
      } finally {
        setLoading(false);
      }
    }
    loadChannels();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-32 bg-zinc-200 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">チャンネル一覧</h1>
      {channels.length === 0 ? (
        <p className="text-zinc-500">チャンネルがまだ登録されていません。</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {channels.map((channel) => (
            <Link
              key={channel.channelId}
              href={`/channels/${channel.channelId}`}
            >
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardContent className="p-6">
                  <h2 className="font-semibold text-lg mb-2">
                    {channel.channelName}
                  </h2>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="secondary">{channel.category}</Badge>
                    <span className="text-sm text-zinc-500">
                      {channel.videoCount}本の要約
                    </span>
                  </div>
                  {channel.channelUrl && (
                    <p className="text-xs text-zinc-400 truncate">
                      {channel.channelUrl}
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Video } from "@/lib/types";
import { searchVideos } from "@/lib/api";
import { useAuth } from "@/components/auth-provider";
import VideoCard from "@/components/video-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get("q") || "";
  const { user } = useAuth();

  const [results, setResults] = useState<Video[]>([]);
  const [searchInput, setSearchInput] = useState(query);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (query) {
      performSearch(query);
    }
  }, [query]);

  async function performSearch(q: string) {
    setLoading(true);
    setSearched(true);
    try {
      const data = await searchVideos(q);
      setResults(data.items);
    } catch (error) {
      console.error("Search failed:", error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (searchInput.trim()) {
      window.history.pushState(
        {},
        "",
        `/search?q=${encodeURIComponent(searchInput.trim())}`
      );
      performSearch(searchInput.trim());
    }
  }

  function handleVideoClick(videoId: string) {
    if (!user) {
      router.push("/auth/login");
    } else {
      router.push(`/videos/${videoId}`);
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">検索</h1>

      <form onSubmit={handleSubmit} className="flex gap-3 mb-8 max-w-xl">
        <Input
          type="search"
          placeholder="キーワード・チャンネル名・タグで検索..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <Button type="submit">検索</Button>
      </form>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-zinc-200 aspect-video rounded-lg" />
              <div className="mt-3 h-4 bg-zinc-200 rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : searched ? (
        <>
          <p className="text-sm text-zinc-500 mb-4">
            「{query}」の検索結果: {results.length}件
          </p>
          {results.length === 0 ? (
            <p className="text-zinc-500">検索結果が見つかりませんでした。</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.map((video) => (
                <div
                  key={video.videoId}
                  onClick={() => handleVideoClick(video.videoId)}
                  className="cursor-pointer"
                >
                  <VideoCard video={video} />
                  {!user && (
                    <p className="text-xs text-zinc-400 mt-1">
                      要約を読むには
                      <Link href="/auth/login" className="text-red-600 underline">ログイン</Link>
                      が必要です
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense>
      <SearchContent />
    </Suspense>
  );
}

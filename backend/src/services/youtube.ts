import { google } from "googleapis";

const youtube = google.youtube({
  version: "v3",
  auth: process.env.YOUTUBE_API_KEY,
});

interface VideoMetadata {
  videoId: string;
  title: string;
  channelId: string;
  channelName: string;
  publishedAt: string;
  thumbnailUrl: string;
  videoUrl: string;
  duration: string;
}

export function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export async function getVideoMetadata(videoId: string): Promise<VideoMetadata | null> {
  const response = await youtube.videos.list({
    part: ["snippet", "contentDetails"],
    id: [videoId],
  });

  const item = response.data.items?.[0];
  if (!item) return null;

  return {
    videoId,
    title: item.snippet?.title || "",
    channelId: item.snippet?.channelId || "",
    channelName: item.snippet?.channelTitle || "",
    publishedAt: item.snippet?.publishedAt || "",
    thumbnailUrl:
      item.snippet?.thumbnails?.high?.url ||
      item.snippet?.thumbnails?.default?.url ||
      "",
    videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
    duration: item.contentDetails?.duration || "",
  };
}

export async function getLatestVideos(
  channelId: string,
  publishedAfter: string,
  maxResults = 5
): Promise<VideoMetadata[]> {
  const searchResponse = await youtube.search.list({
    part: ["snippet"],
    channelId,
    order: "date",
    type: ["video"],
    publishedAfter,
    maxResults,
  });

  const items = searchResponse.data.items || [];
  const videos: VideoMetadata[] = [];

  for (const item of items) {
    const vid = item.id?.videoId;
    if (!vid) continue;

    const metadata = await getVideoMetadata(vid);
    if (metadata) {
      videos.push(metadata);
    }
  }

  return videos;
}

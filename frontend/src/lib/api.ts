import { Video, Channel, ChannelRequest } from "./types";
import { mockVideos, mockChannels } from "./mock-data";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";
const USE_MOCK = !API_URL;

async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || `API error: ${res.status}`);
  }

  return res.json();
}

function adminHeaders(password: string): HeadersInit {
  const encoded = btoa(`admin:${password}`);
  return { Authorization: `Basic ${encoded}` };
}

// ========================================
// Videos
// ========================================

export async function getVideos(limit = 20) {
  if (USE_MOCK) {
    return { items: mockVideos.slice(0, limit), lastKey: undefined };
  }
  return fetchApi<{ items: Video[]; lastKey?: unknown }>(`/videos?limit=${limit}`);
}

export async function getVideo(videoId: string) {
  if (USE_MOCK) {
    const video = mockVideos.find((v) => v.videoId === videoId);
    if (!video) throw new Error("動画が見つかりません");
    return video;
  }
  return fetchApi<Video>(`/videos/${videoId}`);
}

export async function getVideosByChannel(channelId: string, limit = 20) {
  if (USE_MOCK) {
    const items = mockVideos
      .filter((v) => v.channelId === channelId)
      .slice(0, limit);
    return { items, lastKey: undefined };
  }
  return fetchApi<{ items: Video[]; lastKey?: unknown }>(
    `/videos?channelId=${channelId}&limit=${limit}`
  );
}

// ========================================
// Admin Videos
// ========================================

export async function createVideoSummary(
  password: string,
  videoUrl: string,
  transcript: string
) {
  return fetchApi<{
    videoId: string;
    title: string;
    summary: string;
    keyPoints: string[];
    chapters: unknown[];
    tags: string[];
  }>("/admin/videos", {
    method: "POST",
    headers: adminHeaders(password),
    body: JSON.stringify({ videoUrl, transcript }),
  });
}

export async function updateVideo(
  password: string,
  videoId: string,
  data: Partial<Video>
) {
  return fetchApi<{ message: string }>("/admin/videos", {
    method: "PUT",
    headers: adminHeaders(password),
    body: JSON.stringify({ videoId, ...data }),
  });
}

// ========================================
// Channels
// ========================================

export async function getChannels() {
  if (USE_MOCK) {
    return { items: mockChannels };
  }
  return fetchApi<{ items: Channel[] }>("/channels");
}

export async function getChannel(channelId: string) {
  if (USE_MOCK) {
    const channel = mockChannels.find((c) => c.channelId === channelId);
    if (!channel) throw new Error("チャンネルが見つかりません");
    return channel;
  }
  return fetchApi<Channel>(`/channels/${channelId}`);
}

export async function addChannel(
  password: string,
  channel: { channelId: string; channelName: string; channelUrl: string; category: string }
) {
  return fetchApi<{ message: string }>("/channels", {
    method: "POST",
    headers: adminHeaders(password),
    body: JSON.stringify(channel),
  });
}

// ========================================
// Subscriptions（購読管理）
// ========================================

// モック用の購読ストレージ
const mockSubscriptions: Set<string> = new Set();

export async function subscribe(channelId: string, userId: string, email: string) {
  if (USE_MOCK) {
    mockSubscriptions.add(`${userId}:${channelId}`);
    return { message: "購読を登録しました" };
  }
  return fetchApi<{ message: string }>("/subscriptions", {
    method: "POST",
    body: JSON.stringify({ channelId, userId, email }),
  });
}

export async function unsubscribe(channelId: string, userId: string) {
  if (USE_MOCK) {
    mockSubscriptions.delete(`${userId}:${channelId}`);
    return { message: "購読を解除しました" };
  }
  return fetchApi<{ message: string }>("/subscriptions", {
    method: "DELETE",
    body: JSON.stringify({ channelId, userId }),
  });
}

export async function getSubscriptions(userId: string) {
  if (USE_MOCK) {
    const items = Array.from(mockSubscriptions)
      .filter((key) => key.startsWith(`${userId}:`))
      .map((key) => ({ channelId: key.split(":")[1], userId }));
    return { items };
  }
  return fetchApi<{ items: Array<{ channelId: string }> }>(
    `/subscriptions?userId=${userId}`
  );
}

// ========================================
// Requests
// ========================================

export async function submitRequest(data: {
  channelName: string;
  channelUrl: string;
  requesterEmail: string;
  message?: string;
}) {
  if (USE_MOCK) {
    return { requestId: "mock-001", message: "リクエストを受け付けました" };
  }
  return fetchApi<{ requestId: string; message: string }>("/requests", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getRequests(password: string, status?: string) {
  if (USE_MOCK) {
    return { items: [] as ChannelRequest[] };
  }
  const query = status ? `?status=${status}` : "";
  return fetchApi<{ items: ChannelRequest[] }>(`/requests${query}`, {
    headers: adminHeaders(password),
  });
}

// ========================================
// Search
// ========================================

export async function searchVideos(query: string) {
  if (USE_MOCK) {
    const q = query.toLowerCase();
    const items = mockVideos.filter(
      (v) =>
        v.title.toLowerCase().includes(q) ||
        v.summary.toLowerCase().includes(q) ||
        v.channelName.toLowerCase().includes(q) ||
        v.tags?.some((t) => t.toLowerCase().includes(q))
    );
    return { items };
  }
  return fetchApi<{ items: Video[] }>(`/search?q=${encodeURIComponent(query)}`);
}

export interface Video {
  videoId: string;
  title: string;
  channelId: string;
  channelName: string;
  publishedAt: string;
  thumbnailUrl: string;
  videoUrl: string;
  duration: string;
  summary: string;
  summaryStatus: "pending" | "processing" | "completed" | "error";
  keyPoints?: string[];
  chapters?: Chapter[];
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Chapter {
  startTime: string;
  endTime?: string;
  chapterTitle: string;
  chapterSummary: string;
  youtubeTimestampUrl: string;
}

export interface Channel {
  channelId: string;
  channelName: string;
  channelUrl: string;
  thumbnailUrl: string;
  category: string;
  isActive: boolean;
  lastCheckedAt: string;
  videoCount: number;
  requestCount: number;
  addedAt: string;
}

export interface ChannelRequest {
  requestId: string;
  channelName: string;
  channelUrl: string;
  requesterEmail: string;
  message: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

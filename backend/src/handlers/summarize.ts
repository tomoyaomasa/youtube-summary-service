import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { putVideo, updateVideoSummary, getVideo } from "../services/dynamodb";
import { generateSummary } from "../services/claude";
import { extractVideoId, getVideoMetadata } from "../services/youtube";
import { verifyAdmin } from "../utils/auth";
import { success, badRequest, unauthorized, serverError } from "../utils/response";

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    if (!verifyAdmin(event)) return unauthorized();

    const body = JSON.parse(event.body || "{}");
    const { videoUrl, transcript } = body;

    if (!videoUrl || !transcript) {
      return badRequest("videoUrlとtranscriptは必須です");
    }

    // YouTube動画IDを抽出
    const videoId = extractVideoId(videoUrl);
    if (!videoId) {
      return badRequest("有効なYouTube URLを入力してください");
    }

    // 既存の動画チェック
    const existing = await getVideo(videoId);

    // YouTube APIからメタデータ取得
    const metadata = await getVideoMetadata(videoId);
    if (!metadata) {
      return badRequest("動画のメタデータを取得できませんでした");
    }

    // まずpendingステータスで保存
    if (!existing) {
      await putVideo({
        videoId,
        title: metadata.title,
        channelId: metadata.channelId,
        channelName: metadata.channelName,
        publishedAt: metadata.publishedAt,
        thumbnailUrl: metadata.thumbnailUrl,
        videoUrl: metadata.videoUrl,
        duration: metadata.duration,
        summaryStatus: "processing",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    // Claude APIで要約生成
    const summaryResult = await generateSummary(
      metadata.title,
      metadata.channelName,
      transcript
    );

    // チャプターにYouTubeタイムスタンプURLを追加
    const chaptersWithUrls = summaryResult.chapters.map((ch) => {
      const timeParts = ch.startTime.split(":").map(Number);
      const totalSeconds =
        (timeParts[0] || 0) * 3600 + (timeParts[1] || 0) * 60 + (timeParts[2] || 0);
      return {
        ...ch,
        youtubeTimestampUrl: `https://youtu.be/${videoId}?t=${totalSeconds}`,
      };
    });

    // 要約をDBに保存
    await updateVideoSummary(
      videoId,
      summaryResult.overallSummary,
      chaptersWithUrls,
      summaryResult.tags,
      summaryResult.keyPoints
    );

    return success({
      videoId,
      title: metadata.title,
      summary: summaryResult.overallSummary,
      keyPoints: summaryResult.keyPoints,
      chapters: chaptersWithUrls,
      tags: summaryResult.tags,
    });
  } catch (error) {
    console.error("Summarize handler error:", error);
    return serverError("要約の生成に失敗しました");
  }
}

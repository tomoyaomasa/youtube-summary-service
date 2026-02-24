import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { getVideo, getChannel, getSubscribersByChannel } from "../services/dynamodb";
import { sendSummaryNotification } from "../services/ses";
import { verifyAdmin } from "../utils/auth";
import { success, badRequest, unauthorized, notFound, serverError } from "../utils/response";

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    if (!verifyAdmin(event)) return unauthorized();

    const body = JSON.parse(event.body || "{}");
    const { videoId } = body;
    if (!videoId) return badRequest("videoIdは必須です");

    const video = await getVideo(videoId);
    if (!video) return notFound("動画が見つかりません");

    const channel = await getChannel(video.channelId as string);
    const channelName = (channel?.channelName as string) || (video.channelName as string);

    // 購読者一覧を取得
    const subscribers = await getSubscribersByChannel(video.channelId as string);

    let sentCount = 0;
    for (const sub of subscribers) {
      if (!sub.isActive) continue;
      try {
        await sendSummaryNotification(
          sub.email as string,
          channelName,
          video.title as string,
          video.videoId as string,
          video.thumbnailUrl as string,
          video.summary as string,
          (video.chapters as Array<{ startTime: string; chapterTitle: string; chapterSummary: string; youtubeTimestampUrl: string }>) || [],
          process.env.SITE_URL || "https://yourdomain.com"
        );
        sentCount++;
      } catch (emailError) {
        console.error(`Failed to send to ${sub.email}:`, emailError);
      }
    }

    return success({ message: `${sentCount}件の通知メールを送信しました` });
  } catch (error) {
    console.error("NotifySummary handler error:", error);
    return serverError();
  }
}

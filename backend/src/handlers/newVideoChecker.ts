import {
  listActiveChannels,
  putVideo,
  getSubscribersByChannel,
  updateChannelLastChecked,
} from "../services/dynamodb";
import { getLatestVideos } from "../services/youtube";
import { sendNewVideoNotification } from "../services/ses";

export async function handler(): Promise<void> {
  console.log("Starting new video check...");

  const channels = await listActiveChannels();
  console.log(`Found ${channels.length} active channels`);

  for (const channel of channels) {
    try {
      const lastChecked = (channel.lastCheckedAt as string) || new Date(0).toISOString();

      const newVideos = await getLatestVideos(
        channel.channelId as string,
        lastChecked
      );

      console.log(
        `Channel ${channel.channelName}: ${newVideos.length} new videos`
      );

      for (const video of newVideos) {
        // videosテーブルにpendingで登録
        await putVideo({
          videoId: video.videoId,
          title: video.title,
          channelId: video.channelId,
          channelName: video.channelName,
          publishedAt: video.publishedAt,
          thumbnailUrl: video.thumbnailUrl,
          videoUrl: video.videoUrl,
          duration: video.duration,
          summaryStatus: "pending",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        // 購読者に通知メールを送信
        const subscribers = await getSubscribersByChannel(
          channel.channelId as string
        );

        for (const subscriber of subscribers) {
          try {
            await sendNewVideoNotification(
              subscriber.email as string,
              channel.channelName as string,
              video.title,
              video.videoUrl,
              video.thumbnailUrl
            );
          } catch (emailError) {
            console.error(
              `Failed to send notification to ${subscriber.email}:`,
              emailError
            );
          }
        }
      }

      // lastCheckedAtを更新
      await updateChannelLastChecked(channel.channelId as string);
    } catch (channelError) {
      console.error(
        `Error checking channel ${channel.channelName}:`,
        channelError
      );
    }
  }

  console.log("New video check completed.");
}

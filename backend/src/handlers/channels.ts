import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { getChannel, putChannel, listChannels } from "../services/dynamodb";
import { verifyAdmin } from "../utils/auth";
import { success, notFound, badRequest, unauthorized, serverError } from "../utils/response";

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const method = event.httpMethod;
    const channelId = event.pathParameters?.channelId;

    // GET /channels/{channelId}
    if (method === "GET" && channelId) {
      const channel = await getChannel(channelId);
      if (!channel) return notFound("チャンネルが見つかりません");
      return success(channel);
    }

    // GET /channels
    if (method === "GET") {
      const channels = await listChannels();
      return success({ items: channels });
    }

    // POST /channels（管理者のみ）
    if (method === "POST") {
      if (!verifyAdmin(event)) return unauthorized();

      const body = JSON.parse(event.body || "{}");
      const { channelId: newChannelId, channelName, channelUrl, category } = body;

      if (!newChannelId || !channelName) {
        return badRequest("channelIdとchannelNameは必須です");
      }

      await putChannel({
        channelId: newChannelId,
        channelName,
        channelUrl: channelUrl || "",
        thumbnailUrl: "",
        category: category || "business",
        isActive: true,
        lastCheckedAt: new Date().toISOString(),
        videoCount: 0,
        requestCount: 0,
        addedAt: new Date().toISOString(),
      });

      return success({ message: "チャンネルを追加しました" });
    }

    return badRequest("サポートされていないメソッドです");
  } catch (error) {
    console.error("Channels handler error:", error);
    return serverError();
  }
}

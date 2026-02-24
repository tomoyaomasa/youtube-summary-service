import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { v4 as uuidv4 } from "uuid";
import {
  putRequest,
  listRequests,
  getChannel,
  incrementChannelRequestCount,
} from "../services/dynamodb";
import { sendRequestConfirmation, sendAdminNotification } from "../services/ses";
import { verifyAdmin } from "../utils/auth";
import { success, created, badRequest, unauthorized, serverError } from "../utils/response";

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const method = event.httpMethod;

    // GET /requests（管理者のみ）
    if (method === "GET") {
      if (!verifyAdmin(event)) return unauthorized();
      const status = event.queryStringParameters?.status;
      const requests = await listRequests(status);
      return success({ items: requests });
    }

    // POST /requests
    if (method === "POST") {
      const body = JSON.parse(event.body || "{}");
      const { channelName, channelUrl, requesterEmail, message } = body;

      if (!channelName || !channelUrl || !requesterEmail) {
        return badRequest("channelName、channelUrl、requesterEmailは必須です");
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(requesterEmail)) {
        return badRequest("有効なメールアドレスを入力してください");
      }

      const requestId = uuidv4();

      await putRequest({
        requestId,
        channelName,
        channelUrl,
        requesterEmail,
        message: message || "",
        status: "pending",
        createdAt: new Date().toISOString(),
      });

      // 既存チャンネルの場合はリクエストカウントをインクリメント
      const channels = await listRequests();
      const existingChannel = channels.find(
        (ch) => ch.channelUrl === channelUrl
      );
      if (existingChannel?.channelId) {
        await incrementChannelRequestCount(existingChannel.channelId);
      }

      // メール通知を送信（エラーが起きても処理は続行）
      try {
        await Promise.all([
          sendRequestConfirmation(requesterEmail, channelName),
          sendAdminNotification(channelName, channelUrl, requesterEmail, message || ""),
        ]);
      } catch (emailError) {
        console.error("Email notification error:", emailError);
      }

      return created({
        requestId,
        message: "リクエストを受け付けました",
      });
    }

    return badRequest("サポートされていないメソッドです");
  } catch (error) {
    console.error("Requests handler error:", error);
    return serverError();
  }
}

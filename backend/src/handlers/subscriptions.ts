import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import {
  putSubscription,
  deleteSubscription,
  getSubscriptionsByUser,
} from "../services/dynamodb";
import { success, badRequest, serverError } from "../utils/response";

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const method = event.httpMethod;

    // GET /subscriptions?userId=xxx
    if (method === "GET") {
      const userId = event.queryStringParameters?.userId;
      if (!userId) return badRequest("userIdは必須です");
      const items = await getSubscriptionsByUser(userId);
      return success({ items });
    }

    // POST /subscriptions（購読登録）
    if (method === "POST") {
      const body = JSON.parse(event.body || "{}");
      const { channelId, userId, email } = body;
      if (!channelId || !userId || !email) {
        return badRequest("channelId、userId、emailは必須です");
      }
      await putSubscription(channelId, userId, email);
      return success({ message: "購読を登録しました" });
    }

    // DELETE /subscriptions（購読解除）
    if (method === "DELETE") {
      const body = JSON.parse(event.body || "{}");
      const { channelId, userId } = body;
      if (!channelId || !userId) {
        return badRequest("channelIdとuserIdは必須です");
      }
      await deleteSubscription(channelId, userId);
      return success({ message: "購読を解除しました" });
    }

    return badRequest("サポートされていないメソッドです");
  } catch (error) {
    console.error("Subscriptions handler error:", error);
    return serverError();
  }
}

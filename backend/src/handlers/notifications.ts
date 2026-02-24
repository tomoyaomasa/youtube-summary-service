import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { putNotification, getChannel } from "../services/dynamodb";
import { success, badRequest, notFound, serverError } from "../utils/response";

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const body = JSON.parse(event.body || "{}");
    const { email, channelId } = body;

    if (!email || !channelId) {
      return badRequest("emailとchannelIdは必須です");
    }

    // メールアドレスの簡易バリデーション
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return badRequest("有効なメールアドレスを入力してください");
    }

    // チャンネルの存在確認
    const channel = await getChannel(channelId);
    if (!channel) return notFound("チャンネルが見つかりません");

    await putNotification(email, channelId);

    return success({
      message: "通知登録が完了しました",
      channelName: channel.channelName,
    });
  } catch (error) {
    console.error("Notifications handler error:", error);
    return serverError();
  }
}

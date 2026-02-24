import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { searchVideos, listVideosByChannel } from "../services/dynamodb";
import { success, badRequest, serverError } from "../utils/response";

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const keyword = event.queryStringParameters?.q;
    const channelId = event.queryStringParameters?.channelId;

    if (!keyword && !channelId) {
      return badRequest("検索キーワード(q)またはchannelIdを指定してください");
    }

    if (channelId) {
      const result = await listVideosByChannel(channelId);
      return success(result);
    }

    const items = await searchVideos(keyword!);

    // publishedAtで降順ソート
    items.sort((a, b) => {
      const dateA = a.publishedAt as string || "";
      const dateB = b.publishedAt as string || "";
      return dateB.localeCompare(dateA);
    });

    return success({ items });
  } catch (error) {
    console.error("Search handler error:", error);
    return serverError();
  }
}

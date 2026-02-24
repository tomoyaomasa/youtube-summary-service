import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { getVideo, listVideos, listVideosByChannel, putVideo } from "../services/dynamodb";
import { verifyAdmin } from "../utils/auth";
import { success, notFound, badRequest, unauthorized, serverError } from "../utils/response";

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const method = event.httpMethod;
    const videoId = event.pathParameters?.videoId;

    // GET /videos/{videoId}
    if (method === "GET" && videoId) {
      const video = await getVideo(videoId);
      if (!video) return notFound("動画が見つかりません");
      return success(video);
    }

    // GET /videos
    if (method === "GET") {
      const channelId = event.queryStringParameters?.channelId;
      const limit = parseInt(event.queryStringParameters?.limit || "20", 10);

      if (channelId) {
        const result = await listVideosByChannel(channelId, limit);
        return success(result);
      }

      const result = await listVideos(limit);
      return success(result);
    }

    // PUT /admin/videos（公開/非公開の切り替え）
    if (method === "PUT") {
      if (!verifyAdmin(event)) return unauthorized();

      const body = JSON.parse(event.body || "{}");
      if (!body.videoId) return badRequest("videoIdは必須です");

      const existing = await getVideo(body.videoId);
      if (!existing) return notFound("動画が見つかりません");

      await putVideo({
        ...existing,
        ...body,
        updatedAt: new Date().toISOString(),
      });

      return success({ message: "更新しました" });
    }

    return badRequest("サポートされていないメソッドです");
  } catch (error) {
    console.error("Videos handler error:", error);
    return serverError();
  }
}

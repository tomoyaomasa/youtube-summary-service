import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  ScanCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: process.env.AWS_REGION || "ap-northeast-1" });
const docClient = DynamoDBDocumentClient.from(client);

// ========================================
// Videos
// ========================================

export async function getVideo(videoId: string) {
  const result = await docClient.send(
    new GetCommand({
      TableName: process.env.VIDEOS_TABLE,
      Key: { videoId, sk: "metadata" },
    })
  );
  return result.Item;
}

export async function putVideo(video: Record<string, unknown>) {
  await docClient.send(
    new PutCommand({
      TableName: process.env.VIDEOS_TABLE,
      Item: { ...video, sk: "metadata" },
    })
  );
}

export async function updateVideoSummary(
  videoId: string,
  summary: string,
  chapters: unknown[],
  tags: string[],
  keyPoints: string[]
) {
  await docClient.send(
    new UpdateCommand({
      TableName: process.env.VIDEOS_TABLE,
      Key: { videoId, sk: "metadata" },
      UpdateExpression:
        "SET summary = :summary, chapters = :chapters, tags = :tags, keyPoints = :keyPoints, summaryStatus = :status, updatedAt = :now",
      ExpressionAttributeValues: {
        ":summary": summary,
        ":chapters": chapters,
        ":tags": tags,
        ":keyPoints": keyPoints,
        ":status": "completed",
        ":now": new Date().toISOString(),
      },
    })
  );
}

export async function listVideos(limit = 20, lastKey?: Record<string, unknown>) {
  const result = await docClient.send(
    new ScanCommand({
      TableName: process.env.VIDEOS_TABLE,
      FilterExpression: "sk = :sk AND summaryStatus = :status",
      ExpressionAttributeValues: {
        ":sk": "metadata",
        ":status": "completed",
      },
      Limit: limit,
      ExclusiveStartKey: lastKey,
    })
  );
  return {
    items: result.Items || [],
    lastKey: result.LastEvaluatedKey,
  };
}

export async function listVideosByChannel(
  channelId: string,
  limit = 20,
  lastKey?: Record<string, unknown>
) {
  const result = await docClient.send(
    new QueryCommand({
      TableName: process.env.VIDEOS_TABLE,
      IndexName: "channelId-publishedAt-index",
      KeyConditionExpression: "channelId = :channelId",
      FilterExpression: "summaryStatus = :status",
      ExpressionAttributeValues: {
        ":channelId": channelId,
        ":status": "completed",
      },
      ScanIndexForward: false,
      Limit: limit,
      ExclusiveStartKey: lastKey,
    })
  );
  return {
    items: result.Items || [],
    lastKey: result.LastEvaluatedKey,
  };
}

// ========================================
// Channels
// ========================================

export async function getChannel(channelId: string) {
  const result = await docClient.send(
    new GetCommand({
      TableName: process.env.CHANNELS_TABLE,
      Key: { channelId, sk: "metadata" },
    })
  );
  return result.Item;
}

export async function putChannel(channel: Record<string, unknown>) {
  await docClient.send(
    new PutCommand({
      TableName: process.env.CHANNELS_TABLE,
      Item: { ...channel, sk: "metadata" },
    })
  );
}

export async function listChannels() {
  const result = await docClient.send(
    new ScanCommand({
      TableName: process.env.CHANNELS_TABLE,
      FilterExpression: "sk = :sk",
      ExpressionAttributeValues: { ":sk": "metadata" },
    })
  );
  return result.Items || [];
}

export async function listActiveChannels() {
  const result = await docClient.send(
    new ScanCommand({
      TableName: process.env.CHANNELS_TABLE,
      FilterExpression: "sk = :sk AND isActive = :active",
      ExpressionAttributeValues: {
        ":sk": "metadata",
        ":active": true,
      },
    })
  );
  return result.Items || [];
}

export async function updateChannelLastChecked(channelId: string) {
  await docClient.send(
    new UpdateCommand({
      TableName: process.env.CHANNELS_TABLE,
      Key: { channelId, sk: "metadata" },
      UpdateExpression: "SET lastCheckedAt = :now",
      ExpressionAttributeValues: {
        ":now": new Date().toISOString(),
      },
    })
  );
}

export async function incrementChannelRequestCount(channelId: string) {
  await docClient.send(
    new UpdateCommand({
      TableName: process.env.CHANNELS_TABLE,
      Key: { channelId, sk: "metadata" },
      UpdateExpression: "SET requestCount = if_not_exists(requestCount, :zero) + :one",
      ExpressionAttributeValues: {
        ":zero": 0,
        ":one": 1,
      },
    })
  );
}

// ========================================
// Subscriptions
// ========================================

export async function putSubscription(channelId: string, userId: string, email: string) {
  await docClient.send(
    new PutCommand({
      TableName: process.env.SUBSCRIPTIONS_TABLE,
      Item: {
        channelId,
        userId,
        email,
        isActive: true,
        subscribedAt: new Date().toISOString(),
      },
    })
  );
}

export async function deleteSubscription(channelId: string, userId: string) {
  await docClient.send(
    new UpdateCommand({
      TableName: process.env.SUBSCRIPTIONS_TABLE,
      Key: { channelId, userId },
      UpdateExpression: "SET isActive = :inactive",
      ExpressionAttributeValues: { ":inactive": false },
    })
  );
}

export async function getSubscriptionsByUser(userId: string) {
  const result = await docClient.send(
    new QueryCommand({
      TableName: process.env.SUBSCRIPTIONS_TABLE,
      IndexName: "userId-index",
      KeyConditionExpression: "userId = :userId",
      FilterExpression: "isActive = :active",
      ExpressionAttributeValues: {
        ":userId": userId,
        ":active": true,
      },
    })
  );
  return result.Items || [];
}

export async function getSubscribersByChannel(channelId: string) {
  const result = await docClient.send(
    new QueryCommand({
      TableName: process.env.SUBSCRIPTIONS_TABLE,
      KeyConditionExpression: "channelId = :channelId",
      FilterExpression: "isActive = :active",
      ExpressionAttributeValues: {
        ":channelId": channelId,
        ":active": true,
      },
    })
  );
  return result.Items || [];
}

// ========================================
// Requests
// ========================================

export async function putRequest(request: Record<string, unknown>) {
  await docClient.send(
    new PutCommand({
      TableName: process.env.REQUESTS_TABLE,
      Item: { ...request, sk: "request" },
    })
  );
}

export async function listRequests(status?: string) {
  if (status) {
    const result = await docClient.send(
      new QueryCommand({
        TableName: process.env.REQUESTS_TABLE,
        IndexName: "status-index",
        KeyConditionExpression: "#status = :status",
        ExpressionAttributeNames: { "#status": "status" },
        ExpressionAttributeValues: { ":status": status },
        ScanIndexForward: false,
      })
    );
    return result.Items || [];
  }

  const result = await docClient.send(
    new ScanCommand({
      TableName: process.env.REQUESTS_TABLE,
      FilterExpression: "sk = :sk",
      ExpressionAttributeValues: { ":sk": "request" },
    })
  );
  return result.Items || [];
}

// ========================================
// Search
// ========================================

export async function searchVideos(keyword: string) {
  const result = await docClient.send(
    new ScanCommand({
      TableName: process.env.VIDEOS_TABLE,
      FilterExpression:
        "sk = :sk AND summaryStatus = :status AND (contains(title, :keyword) OR contains(summary, :keyword) OR contains(channelName, :keyword))",
      ExpressionAttributeValues: {
        ":sk": "metadata",
        ":status": "completed",
        ":keyword": keyword,
      },
    })
  );
  return result.Items || [];
}

import * as cdk from "aws-cdk-lib";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as events from "aws-cdk-lib/aws-events";
import * as targets from "aws-cdk-lib/aws-events-targets";
import * as iam from "aws-cdk-lib/aws-iam";
import * as cognito from "aws-cdk-lib/aws-cognito";
import { Construct } from "constructs";
import * as path from "path";

export class YoutubeSummaryStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ========================================
    // Cognito User Pool
    // ========================================

    const userPool = new cognito.UserPool(this, "UserPool", {
      userPoolName: "youtube-summary-users",
      selfSignUpEnabled: true,
      signInAliases: { email: true },
      autoVerify: { email: true },
      standardAttributes: {
        email: { required: true, mutable: false },
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: false,
        requireDigits: true,
        requireSymbols: false,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    const userPoolClient = new cognito.UserPoolClient(this, "UserPoolClient", {
      userPool,
      userPoolClientName: "youtube-summary-web",
      authFlows: {
        userPassword: true,
        userSrp: true,
      },
      generateSecret: false,
    });

    // ========================================
    // DynamoDB テーブル
    // ========================================

    // videos テーブル
    const videosTable = new dynamodb.Table(this, "VideosTable", {
      tableName: "youtube-summary-videos",
      partitionKey: { name: "videoId", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "sk", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    videosTable.addGlobalSecondaryIndex({
      indexName: "channelId-publishedAt-index",
      partitionKey: { name: "channelId", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "publishedAt", type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    videosTable.addGlobalSecondaryIndex({
      indexName: "summaryStatus-index",
      partitionKey: { name: "summaryStatus", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "publishedAt", type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // channels テーブル
    const channelsTable = new dynamodb.Table(this, "ChannelsTable", {
      tableName: "youtube-summary-channels",
      partitionKey: { name: "channelId", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "sk", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    channelsTable.addGlobalSecondaryIndex({
      indexName: "category-index",
      partitionKey: { name: "category", type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // users テーブル（PK: userId = Cognito Sub ID）
    const usersTable = new dynamodb.Table(this, "UsersTable", {
      tableName: "youtube-summary-users",
      partitionKey: { name: "userId", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "sk", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // subscriptions テーブル（新規）
    const subscriptionsTable = new dynamodb.Table(this, "SubscriptionsTable", {
      tableName: "youtube-summary-subscriptions",
      partitionKey: { name: "channelId", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "userId", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    subscriptionsTable.addGlobalSecondaryIndex({
      indexName: "userId-index",
      partitionKey: { name: "userId", type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // requests テーブル
    const requestsTable = new dynamodb.Table(this, "RequestsTable", {
      tableName: "youtube-summary-requests",
      partitionKey: { name: "requestId", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "sk", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    requestsTable.addGlobalSecondaryIndex({
      indexName: "status-index",
      partitionKey: { name: "status", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "createdAt", type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // ========================================
    // Lambda 関数
    // ========================================

    const backendCodePath = path.join(__dirname, "../../backend/dist");

    const commonEnv = {
      VIDEOS_TABLE: videosTable.tableName,
      CHANNELS_TABLE: channelsTable.tableName,
      USERS_TABLE: usersTable.tableName,
      SUBSCRIPTIONS_TABLE: subscriptionsTable.tableName,
      REQUESTS_TABLE: requestsTable.tableName,
      ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || "",
      YOUTUBE_API_KEY: process.env.YOUTUBE_API_KEY || "",
      SES_FROM_EMAIL: process.env.SES_FROM_EMAIL || "noreply@yourdomain.com",
      SES_REGION: process.env.SES_REGION || "ap-northeast-1",
      ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || "",
      SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || "https://yourdomain.com",
      COGNITO_USER_POOL_ID: userPool.userPoolId,
    };

    const videosFunction = new lambda.Function(this, "VideosFunction", {
      functionName: "youtube-summary-videos",
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "handlers/videos.handler",
      code: lambda.Code.fromAsset(backendCodePath),
      timeout: cdk.Duration.seconds(60),
      memorySize: 256,
      environment: commonEnv,
    });

    const summarizeFunction = new lambda.Function(this, "SummarizeFunction", {
      functionName: "youtube-summary-summarize",
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "handlers/summarize.handler",
      code: lambda.Code.fromAsset(backendCodePath),
      timeout: cdk.Duration.seconds(120),
      memorySize: 512,
      environment: commonEnv,
    });

    const channelsFunction = new lambda.Function(this, "ChannelsFunction", {
      functionName: "youtube-summary-channels",
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "handlers/channels.handler",
      code: lambda.Code.fromAsset(backendCodePath),
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      environment: commonEnv,
    });

    // 購読管理 Lambda
    const subscriptionsFunction = new lambda.Function(this, "SubscriptionsFunction", {
      functionName: "youtube-summary-subscriptions",
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "handlers/subscriptions.handler",
      code: lambda.Code.fromAsset(backendCodePath),
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      environment: commonEnv,
    });

    // 要約公開通知 Lambda
    const notifySummaryFunction = new lambda.Function(this, "NotifySummaryFunction", {
      functionName: "youtube-summary-notify-summary",
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "handlers/notifySummary.handler",
      code: lambda.Code.fromAsset(backendCodePath),
      timeout: cdk.Duration.seconds(120),
      memorySize: 256,
      environment: commonEnv,
    });

    const requestsFunction = new lambda.Function(this, "RequestsFunction", {
      functionName: "youtube-summary-requests",
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "handlers/requests.handler",
      code: lambda.Code.fromAsset(backendCodePath),
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      environment: commonEnv,
    });

    const searchFunction = new lambda.Function(this, "SearchFunction", {
      functionName: "youtube-summary-search",
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "handlers/search.handler",
      code: lambda.Code.fromAsset(backendCodePath),
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      environment: commonEnv,
    });

    const newVideoCheckerFunction = new lambda.Function(this, "NewVideoCheckerFunction", {
      functionName: "youtube-summary-new-video-checker",
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "handlers/newVideoChecker.handler",
      code: lambda.Code.fromAsset(backendCodePath),
      timeout: cdk.Duration.seconds(300),
      memorySize: 512,
      environment: commonEnv,
    });

    // DynamoDB アクセス権限
    const allTables = [
      videosTable, channelsTable, usersTable,
      subscriptionsTable, requestsTable,
    ];
    const allFunctions = [
      videosFunction, summarizeFunction, channelsFunction,
      subscriptionsFunction, notifySummaryFunction,
      requestsFunction, searchFunction, newVideoCheckerFunction,
    ];

    for (const table of allTables) {
      for (const fn of allFunctions) {
        table.grantReadWriteData(fn);
      }
    }

    // SES 送信権限
    const sesPolicy = new iam.PolicyStatement({
      actions: ["ses:SendEmail", "ses:SendRawEmail"],
      resources: ["*"],
    });
    notifySummaryFunction.addToRolePolicy(sesPolicy);
    requestsFunction.addToRolePolicy(sesPolicy);
    newVideoCheckerFunction.addToRolePolicy(sesPolicy);

    // ========================================
    // API Gateway
    // ========================================

    const api = new apigateway.RestApi(this, "YoutubeSummaryApi", {
      restApiName: "YouTube Summary API",
      description: "YouTube動画要約サービス API",
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ["Content-Type", "Authorization", "X-Amz-Date", "X-Api-Key"],
      },
      deployOptions: { stageName: "prod" },
    });

    // /videos
    const videosResource = api.root.addResource("videos");
    videosResource.addMethod("GET", new apigateway.LambdaIntegration(videosFunction));
    const videoDetailResource = videosResource.addResource("{videoId}");
    videoDetailResource.addMethod("GET", new apigateway.LambdaIntegration(videosFunction));

    // /admin/videos
    const adminResource = api.root.addResource("admin");
    const adminVideosResource = adminResource.addResource("videos");
    adminVideosResource.addMethod("POST", new apigateway.LambdaIntegration(summarizeFunction));
    adminVideosResource.addMethod("PUT", new apigateway.LambdaIntegration(videosFunction));

    // /admin/channels
    const adminChannelsResource = adminResource.addResource("channels");
    adminChannelsResource.addMethod("POST", new apigateway.LambdaIntegration(channelsFunction));
    adminChannelsResource.addMethod("PUT", new apigateway.LambdaIntegration(channelsFunction));
    adminChannelsResource.addMethod("DELETE", new apigateway.LambdaIntegration(channelsFunction));

    // /admin/requests
    const adminRequestsResource = adminResource.addResource("requests");
    adminRequestsResource.addMethod("GET", new apigateway.LambdaIntegration(requestsFunction));
    adminRequestsResource.addMethod("PUT", new apigateway.LambdaIntegration(requestsFunction));

    // /admin/notify
    const adminNotifyResource = adminResource.addResource("notify");
    adminNotifyResource.addMethod("POST", new apigateway.LambdaIntegration(notifySummaryFunction));

    // /channels
    const channelsResource = api.root.addResource("channels");
    channelsResource.addMethod("GET", new apigateway.LambdaIntegration(channelsFunction));
    const channelDetailResource = channelsResource.addResource("{channelId}");
    channelDetailResource.addMethod("GET", new apigateway.LambdaIntegration(channelsFunction));

    // /subscriptions
    const subscriptionsResource = api.root.addResource("subscriptions");
    subscriptionsResource.addMethod("GET", new apigateway.LambdaIntegration(subscriptionsFunction));
    subscriptionsResource.addMethod("POST", new apigateway.LambdaIntegration(subscriptionsFunction));
    subscriptionsResource.addMethod("DELETE", new apigateway.LambdaIntegration(subscriptionsFunction));

    // /requests
    const requestsResource = api.root.addResource("requests");
    requestsResource.addMethod("POST", new apigateway.LambdaIntegration(requestsFunction));

    // /search
    const searchResource = api.root.addResource("search");
    searchResource.addMethod("GET", new apigateway.LambdaIntegration(searchFunction));

    // ========================================
    // EventBridge（毎日9:00 JST = 0:00 UTC）
    // ========================================

    const dailyRule = new events.Rule(this, "DailyNewVideoCheck", {
      ruleName: "youtube-summary-daily-check",
      schedule: events.Schedule.cron({ minute: "0", hour: "0", day: "*", month: "*", year: "*" }),
    });
    dailyRule.addTarget(new targets.LambdaFunction(newVideoCheckerFunction));

    // ========================================
    // Outputs
    // ========================================

    new cdk.CfnOutput(this, "ApiUrl", { value: api.url, description: "API Gateway URL" });
    new cdk.CfnOutput(this, "UserPoolId", { value: userPool.userPoolId });
    new cdk.CfnOutput(this, "UserPoolClientId", { value: userPoolClient.userPoolClientId });
    new cdk.CfnOutput(this, "VideosTableName", { value: videosTable.tableName });
    new cdk.CfnOutput(this, "ChannelsTableName", { value: channelsTable.tableName });
    new cdk.CfnOutput(this, "SubscriptionsTableName", { value: subscriptionsTable.tableName });
  }
}

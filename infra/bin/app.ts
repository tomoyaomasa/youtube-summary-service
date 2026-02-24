#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { YoutubeSummaryStack } from "../lib/youtube-summary-stack";

const app = new cdk.App();

new YoutubeSummaryStack(app, "YoutubeSummaryStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || "ap-northeast-1",
  },
});

import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

const sesClient = new SESClient({
  region: process.env.SES_REGION || "ap-northeast-1",
});

const fromEmail = process.env.SES_FROM_EMAIL || "noreply@yourdomain.com";
const siteName = "YouTube要約サービス";

export async function sendNewVideoNotification(
  toEmail: string,
  channelName: string,
  videoTitle: string,
  videoUrl: string,
  thumbnailUrl: string
) {
  const subject = `【${siteName}】${channelName}に新着動画が公開されました`;

  const htmlBody = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #1a1a1a;">${channelName}に新着動画</h2>
  <div style="border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; margin: 16px 0;">
    <img src="${thumbnailUrl}" alt="${videoTitle}" style="width: 100%; display: block;" />
    <div style="padding: 16px;">
      <h3 style="margin: 0 0 8px;">${videoTitle}</h3>
      <a href="${videoUrl}" style="color: #ff0000; text-decoration: none;">YouTubeで視聴する →</a>
    </div>
  </div>
  <p style="color: #666;">要約が完成したらお知らせします。</p>
  <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 24px 0;" />
  <p style="color: #999; font-size: 12px;">${siteName}</p>
</body>
</html>`;

  await sesClient.send(
    new SendEmailCommand({
      Source: fromEmail,
      Destination: { ToAddresses: [toEmail] },
      Message: {
        Subject: { Data: subject, Charset: "UTF-8" },
        Body: {
          Html: { Data: htmlBody, Charset: "UTF-8" },
        },
      },
    })
  );
}

export async function sendRequestConfirmation(
  toEmail: string,
  channelName: string
) {
  const subject = `【${siteName}】チャンネルリクエストを受け付けました`;

  const htmlBody = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #1a1a1a;">リクエスト受付完了</h2>
  <p>「${channelName}」のリクエストを受け付けました。</p>
  <p>管理者が確認後、チャンネルが追加されましたらお知らせいたします。</p>
  <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 24px 0;" />
  <p style="color: #999; font-size: 12px;">${siteName}</p>
</body>
</html>`;

  await sesClient.send(
    new SendEmailCommand({
      Source: fromEmail,
      Destination: { ToAddresses: [toEmail] },
      Message: {
        Subject: { Data: subject, Charset: "UTF-8" },
        Body: {
          Html: { Data: htmlBody, Charset: "UTF-8" },
        },
      },
    })
  );
}

export async function sendAdminNotification(
  channelName: string,
  channelUrl: string,
  requesterEmail: string,
  message: string
) {
  const adminEmail = fromEmail;
  const subject = `【${siteName}】新しいチャンネルリクエスト: ${channelName}`;

  const htmlBody = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #1a1a1a;">新しいチャンネルリクエスト</h2>
  <table style="border-collapse: collapse; width: 100%;">
    <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">チャンネル名</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${channelName}</td></tr>
    <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">URL</td><td style="padding: 8px; border-bottom: 1px solid #eee;"><a href="${channelUrl}">${channelUrl}</a></td></tr>
    <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">リクエスト者</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${requesterEmail}</td></tr>
    <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">メッセージ</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${message || "なし"}</td></tr>
  </table>
</body>
</html>`;

  await sesClient.send(
    new SendEmailCommand({
      Source: fromEmail,
      Destination: { ToAddresses: [adminEmail] },
      Message: {
        Subject: { Data: subject, Charset: "UTF-8" },
        Body: {
          Html: { Data: htmlBody, Charset: "UTF-8" },
        },
      },
    })
  );
}

export async function sendSummaryNotification(
  toEmail: string,
  channelName: string,
  videoTitle: string,
  videoId: string,
  thumbnailUrl: string,
  summary: string,
  chapters: Array<{ startTime: string; chapterTitle: string; chapterSummary: string; youtubeTimestampUrl: string }>,
  siteUrl: string
) {
  const subject = `【${channelName}】新しい動画の要約が届きました`;

  const chaptersHtml = chapters
    .map(
      (ch) =>
        `<div style="margin-bottom: 12px; padding: 12px; background: #f9f9f9; border-radius: 6px;">
          <a href="${ch.youtubeTimestampUrl}" style="color: #ff0000; font-size: 12px; text-decoration: none;">${ch.startTime}</a>
          <strong style="margin-left: 8px;">${ch.chapterTitle}</strong>
          <p style="margin: 6px 0 0; font-size: 13px; color: #444;">${ch.chapterSummary}</p>
        </div>`
    )
    .join("");

  const htmlBody = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #1a1a1a;">${channelName}の新しい要約</h2>
  <div style="border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; margin: 16px 0;">
    <img src="${thumbnailUrl}" alt="${videoTitle}" style="width: 100%; display: block;" />
    <div style="padding: 16px;">
      <h3 style="margin: 0 0 12px;">${videoTitle}</h3>
      <p style="color: #333; font-size: 14px; line-height: 1.6;">${summary}</p>
    </div>
  </div>
  ${chaptersHtml ? `<h3 style="margin-top: 24px;">チャプター別要約</h3>${chaptersHtml}` : ""}
  <div style="text-align: center; margin: 24px 0;">
    <a href="${siteUrl}/videos/${videoId}" style="display: inline-block; background: #ff0000; color: #fff; padding: 12px 32px; border-radius: 6px; text-decoration: none; font-weight: bold;">サイトで全文を読む</a>
  </div>
  <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 24px 0;" />
  <p style="color: #999; font-size: 12px; text-align: center;">
    ${siteName} |
    <a href="${siteUrl}/unsubscribe?email=${encodeURIComponent(toEmail)}" style="color: #999;">通知を解除する</a>
  </p>
</body>
</html>`;

  await sesClient.send(
    new SendEmailCommand({
      Source: fromEmail,
      Destination: { ToAddresses: [toEmail] },
      Message: {
        Subject: { Data: subject, Charset: "UTF-8" },
        Body: {
          Html: { Data: htmlBody, Charset: "UTF-8" },
        },
      },
    })
  );
}

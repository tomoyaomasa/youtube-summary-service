import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface SummaryResult {
  overallSummary: string;
  keyPoints: string[];
  chapters: {
    startTime: string;
    chapterTitle: string;
    chapterSummary: string;
  }[];
  tags: string[];
}

export async function generateSummary(
  title: string,
  channelName: string,
  transcript: string
): Promise<SummaryResult> {
  const prompt = `あなたはプロのコンテンツ編集者です。
以下のYouTube動画の書き起こしを要約してください。

【ルール】
- 著作権リスクを避けるため、原文をそのまま使わず必ず自分の言葉で要約する
- 元の表現や文章構造を大幅に変え、情報の本質のみを抽出する
- 全体要約は400〜600文字程度
- チャプター別要約は各100〜200文字程度
- 具体的な数字・固有名詞・事実は正確に記載（これらは著作権保護対象外）
- 話者の主張・見解は「〜と述べています」などの引用表現で記述
- 視聴者が動画を見たくなるような要約にする

【動画情報】
タイトル: ${title}
チャンネル名: ${channelName}

【書き起こし】
${transcript}

【出力形式（JSON）】
{
  "overallSummary": "全体要約テキスト",
  "keyPoints": ["ポイント1", "ポイント2", "ポイント3"],
  "chapters": [
    {
      "startTime": "00:00:00",
      "chapterTitle": "チャプタータイトル",
      "chapterSummary": "要約テキスト"
    }
  ],
  "tags": ["タグ1", "タグ2"]
}

JSONのみを出力してください。`;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type from Claude API");
  }

  const jsonMatch = content.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse JSON from Claude API response");
  }

  return JSON.parse(jsonMatch[0]) as SummaryResult;
}

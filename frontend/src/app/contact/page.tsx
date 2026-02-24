"use client";

import { Card, CardContent } from "@/components/ui/card";

export default function ContactPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-xl">
      <h1 className="text-2xl font-bold mb-6">お問い合わせ・削除依頼</h1>

      <Card>
        <CardContent className="p-6 space-y-4">
          <section>
            <h2 className="font-semibold mb-2">削除依頼について</h2>
            <p className="text-sm text-zinc-600">
              当サイトに掲載されている要約の削除をご希望の場合は、以下のメールアドレスまでご連絡ください。動画クリエイターご本人からのご依頼であることを確認の上、速やかに対応いたします。
            </p>
          </section>

          <section>
            <h2 className="font-semibold mb-2">お問い合わせ先</h2>
            <p className="text-sm text-zinc-600">
              メール: contact@yourdomain.com
            </p>
          </section>

          <section className="text-xs text-zinc-400 border-t pt-4">
            <p>
              本サイトの要約は著作権法第32条に基づく引用の範囲内で作成されています。元動画の視聴促進を目的としており、内容の正確性を保証するものではありません。
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}

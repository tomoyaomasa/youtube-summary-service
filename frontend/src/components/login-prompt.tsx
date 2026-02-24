"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LoginPrompt() {
  return (
    <div className="relative">
      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
        <div className="text-center p-8">
          <p className="text-lg font-semibold mb-2">
            続きを読むにはログインが必要です
          </p>
          <p className="text-sm text-zinc-500 mb-6">
            無料アカウントを作成して、すべての要約にアクセスしましょう
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/auth/login">
              <Button variant="outline">ログイン</Button>
            </Link>
            <Link href="/auth/register">
              <Button>新規登録（無料）</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

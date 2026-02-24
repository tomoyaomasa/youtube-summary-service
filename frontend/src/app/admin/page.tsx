"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (password.trim()) {
      setIsAuthenticated(true);
      if (typeof window !== "undefined") {
        sessionStorage.setItem("admin_password", password);
      }
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-sm">
        <h1 className="text-2xl font-bold mb-6 text-center">管理画面ログイン</h1>
        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">パスワード</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full">ログイン</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Tabs defaultValue="videos">
        <TabsList className="mb-6">
          <TabsTrigger value="videos">
            <Link href="/admin/videos/new">動画登録</Link>
          </TabsTrigger>
          <TabsTrigger value="channels">
            <Link href="/admin/channels">チャンネル管理</Link>
          </TabsTrigger>
          <TabsTrigger value="requests">
            <Link href="/admin/requests">リクエスト一覧</Link>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <Link href="/admin/videos/new">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="p-6 text-center">
              <p className="text-3xl mb-3">📝</p>
              <h3 className="font-semibold mb-2">動画登録・要約生成</h3>
              <p className="text-sm text-zinc-500">YouTube URLと字幕から要約を自動生成</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/admin/channels">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="p-6 text-center">
              <p className="text-3xl mb-3">📺</p>
              <h3 className="font-semibold mb-2">チャンネル管理</h3>
              <p className="text-sm text-zinc-500">チャンネルの追加・編集・監視設定</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/admin/requests">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="p-6 text-center">
              <p className="text-3xl mb-3">📨</p>
              <h3 className="font-semibold mb-2">リクエスト管理</h3>
              <p className="text-sm text-zinc-500">ユーザーからのチャンネルリクエスト</p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getRequests } from "@/lib/api";
import { ChannelRequest } from "@/lib/types";

export default function AdminRequestsPage() {
  const [password] = useState(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("admin_password") || "";
    }
    return "";
  });

  const [requests, setRequests] = useState<ChannelRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  async function loadRequests() {
    setLoading(true);
    try {
      const data = await getRequests(password);
      setRequests(data.items);
      setLoaded(true);
    } catch (error) {
      console.error("Failed to load requests:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">リクエスト管理</h1>
        <Button onClick={loadRequests} disabled={loading} variant="outline">
          {loading ? "読み込み中..." : loaded ? "更新" : "読み込み"}
        </Button>
      </div>

      {!loaded ? (
        <p className="text-zinc-500 text-sm">
          「読み込み」をクリックしてリクエスト一覧を表示
        </p>
      ) : requests.length === 0 ? (
        <p className="text-zinc-500 text-sm">リクエストはありません。</p>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <Card key={req.requestId}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-semibold text-lg">{req.channelName}</p>
                    <a
                      href={req.channelUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {req.channelUrl}
                    </a>
                    <p className="text-xs text-zinc-500 mt-1">
                      {req.requesterEmail} /{" "}
                      {new Date(req.createdAt).toLocaleDateString("ja-JP")}
                    </p>
                    {req.message && (
                      <p className="text-sm text-zinc-600 mt-2 bg-zinc-50 p-2 rounded">
                        {req.message}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2 ml-4">
                    <Badge
                      variant={
                        req.status === "approved"
                          ? "default"
                          : req.status === "rejected"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {req.status === "pending"
                        ? "未対応"
                        : req.status === "approved"
                        ? "承認済"
                        : "却下"}
                    </Badge>
                    {req.status === "pending" && (
                      <div className="flex gap-2">
                        <Button size="sm" className="bg-green-600 hover:bg-green-700">
                          承認して登録
                        </Button>
                        <Button size="sm" variant="destructive">
                          却下
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useAuth } from "@/components/auth-provider";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  const isAdmin = pathname.startsWith("/admin");
  const isAuth = pathname.startsWith("/auth");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  }

  async function handleLogout() {
    await logout();
    router.push("/");
  }

  if (isAdmin) {
    // Admin header is rendered by AdminHeader component inside admin pages
    return null;
  }

  return (
    <header className="border-b bg-white sticky top-0 z-50">
      <div className="container mx-auto px-4 h-14 flex items-center gap-6">
        <Link href="/" className="font-bold text-lg text-red-600 shrink-0">
          YouTube要約
        </Link>

        {!isAuth && (
          <form onSubmit={handleSearch} className="flex-1 max-w-md">
            <Input
              type="search"
              placeholder="動画・チャンネルを検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9"
            />
          </form>
        )}

        <nav className="flex items-center gap-4 text-sm shrink-0">
          {!isAuth && (
            <>
              <Link href="/channels" className="hover:text-red-600">
                チャンネル
              </Link>
              <Link href="/request" className="hover:text-red-600">
                リクエスト
              </Link>
            </>
          )}
          {!loading && (
            <>
              {user ? (
                <div className="flex items-center gap-3">
                  <span className="text-xs text-zinc-500 hidden md:inline">
                    {user.email}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    className="text-zinc-500 hover:text-red-600"
                  >
                    ログアウト
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link href="/auth/login">
                    <Button variant="ghost" size="sm">
                      ログイン
                    </Button>
                  </Link>
                  <Link href="/auth/register">
                    <Button size="sm">新規登録</Button>
                  </Link>
                </div>
              )}
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

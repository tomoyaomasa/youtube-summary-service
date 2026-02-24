"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/admin", label: "ダッシュボード" },
  { href: "/admin/videos/new", label: "動画登録" },
  { href: "/admin/channels", label: "チャンネル管理" },
  { href: "/admin/requests", label: "リクエスト管理" },
];

function getPageName(pathname: string): string {
  const item = navItems.find((n) => n.href === pathname);
  if (item) return item.label;
  if (pathname === "/admin/setup") return "TOTPセットアップ";
  return "管理画面";
}

export default function AdminHeader() {
  const pathname = usePathname();
  const router = useRouter();

  function handleLogout() {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("admin_token");
    }
    router.push("/admin");
  }

  return (
    <div className="border-b bg-zinc-900 text-white">
      {/* Top bar */}
      <div className="container mx-auto px-4 h-12 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <Link href="/admin" className="font-bold text-base hover:text-zinc-300">
            管理画面
          </Link>
          {pathname !== "/admin" && (
            <>
              <span className="text-zinc-500">&gt;</span>
              <span className="text-zinc-300">{getPageName(pathname)}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Link href="/" className="text-xs text-zinc-400 hover:text-white">
            公開サイトへ
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-zinc-400 hover:text-white hover:bg-zinc-800 h-7 text-xs"
          >
            ログアウト
          </Button>
        </div>
      </div>
      {/* Navigation */}
      <div className="container mx-auto px-4">
        <nav className="flex gap-1 -mb-px">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`px-4 py-2 text-sm border-b-2 transition-colors ${
                pathname === item.href
                  ? "border-white text-white"
                  : "border-transparent text-zinc-400 hover:text-white hover:border-zinc-500"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}

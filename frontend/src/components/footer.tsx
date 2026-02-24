import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t bg-zinc-50 py-8 mt-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-zinc-500">
          <div>
            <p>
              ※AIによる要約です。内容の正確性は元動画でご確認ください。
            </p>
          </div>
          <nav className="flex gap-4">
            <Link href="/request" className="hover:text-zinc-700">
              チャンネルリクエスト
            </Link>
            <Link href="/contact" className="hover:text-zinc-700">
              お問い合わせ・削除依頼
            </Link>
          </nav>
        </div>
        <p className="text-center text-xs text-zinc-400 mt-4">
          &copy; {new Date().getFullYear()} YouTube要約サービス
        </p>
      </div>
    </footer>
  );
}

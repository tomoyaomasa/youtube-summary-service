# Vercelデプロイ手順

## 1. GitHubにコードをプッシュ

```bash
cd 12_Youtube
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/[ユーザー名]/[リポジトリ名].git
git push -u origin main
```

## 2. Vercelアカウント作成

https://vercel.com にアクセスしGitHubアカウントで登録

## 3. 新規プロジェクト作成

- 「Add New Project」→「Import Git Repository」
- GitHubと連携してリポジトリを選択
- **Root Directory** を `frontend` に設定する（モノレポのため）

## 4. 環境変数の設定

Vercelのプロジェクト設定 → Environment Variables に以下の各キーと実際の値を入力する：

| 変数名 | 説明 |
|---|---|
| `NEXT_PUBLIC_API_URL` | API GatewayのURL（例: https://xxx.execute-api.ap-northeast-1.amazonaws.com/prod） |
| `NEXT_PUBLIC_SITE_URL` | 公開サイトのURL（例: https://your-app.vercel.app） |
| `NEXT_PUBLIC_COGNITO_USER_POOL_ID` | Cognito User Pool ID |
| `NEXT_PUBLIC_COGNITO_CLIENT_ID` | Cognito User Pool Client ID |
| `NEXT_PUBLIC_COGNITO_REGION` | ap-northeast-1 |

※ バックエンド（Lambda）の環境変数はAWS側で設定済みのため、Vercelに設定するのはフロントエンド用（NEXT_PUBLIC_*）のみ

## 5. デプロイ

「Deploy」ボタンを押すと自動でビルド・公開される。
以降はGitHubのmainブランチにプッシュするたびに自動デプロイ。

## 6. カスタムドメイン（任意）

Vercelのダッシュボード → Domains から独自ドメインを設定可能。

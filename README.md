# YouTube要約サービス

ビジネス系YouTuberの動画を要約・検索できるWebサービス。

## 機能
- 動画要約の閲覧・検索
- チャンネル別の動画一覧
- 新着動画のメール通知登録
- 要約リクエストフォーム

## 技術スタック
- フロントエンド：Next.js / TypeScript / Tailwind CSS
- バックエンド：AWS Lambda / API Gateway
- データベース：DynamoDB
- メール送信：AWS SES

## セットアップ

### 1. リポジトリをクローン
```
git clone [リポジトリURL]
cd [プロジェクト名]
```

### 2. 依存関係インストール
```
npm install
```

### 3. 環境変数の設定
.env.exampleをコピーして.env.localを作成し、各値を設定する：
```
cp .env.example .env.local
```

### 4. ローカル起動
```
npm run dev
```

## デプロイ
Vercelに接続しているため、mainブランチへのプッシュで自動デプロイされます。
環境変数はVercelのダッシュボードで設定してください。

## 管理画面
/admin にアクセス（ADMIN_PASSWORDで認証）

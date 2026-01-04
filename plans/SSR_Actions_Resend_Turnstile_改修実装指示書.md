---

# 改修実装指示書（SSR + Astro Actions + Resend + Cloudflare Turnstile + GTM拡張）

本書は Virex ベースの本リポジトリを、SSR構成へ移行しつつ Contact送信を Astro Actions + Resend + Turnstile で実装し、GTM拡張イベント仕様に準拠させるための実装設計と手順を定義する。

決定方針（今回確定）
- SSR構成 + Astro Actions を採用（メール送信は Resend、Bot対策は Cloudflare Turnstile）
- GTMイベントは拡張版 click_reserve / click_menu / click_access / form_view / form_submit を採用
- 料金ページは既存 [src/pages/pricing.astro](src/pages/pricing.astro) を流用し、/price で公開（/pricing は直接導線しない）
- 公開必須ページは /service /price /contact の3つ（トップや Access は今回は必須外）

---

## 1. 影響範囲と対象ファイル

- SSR/ビルド設定
  - [astro.config.mjs](astro.config.mjs)
  - [.env.example](.env.example)
- レイアウト/共通
  - [src/layouts/BaseLayout.astro](src/layouts/BaseLayout.astro)
  - [src/layouts/MarketingLayout.astro](src/layouts/MarketingLayout.astro)
  - [src/components/common/SEO.astro](src/components/common/SEO.astro)
  - [src/components/layout/Header.astro](src/components/layout/Header.astro)
  - [src/components/layout/Footer.astro](src/components/layout/Footer.astro)
- ルーティング/ページ
  - [src/pages/service.astro](src/pages/service.astro)（新規）
  - [src/pages/price.astro](src/pages/price.astro)（新規, pricing流用）
  - [src/pages/pricing.astro](src/pages/pricing.astro)
  - [src/pages/contact.astro](src/pages/contact.astro)
  - [src/pages/contact/thanks.astro](src/pages/contact/thanks.astro)（新規）
- Actions/サーバ側
  - [src/actions/index.ts](src/actions/index.ts)（新規: [contactSubmit()](src/actions/index.ts:1), [verifyTurnstile()](src/actions/index.ts:50) など）

---

## 2. 環境変数（.env）定義

以下を [.env.example](.env.example) に追記し、実環境用 .env で値を設定する。

```
# GTM（存在時のみ埋め込み）
PUBLIC_GTM_CONTAINER_ID=

# Cloudflare Turnstile
PUBLIC_TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=

# Resend
RESEND_API_KEY=

# 送信先（運用側の受信アドレス）
SITE_CONTACT_TO_EMAIL=

# 顧客JSONの取得元（ローカルパス or 絶対URLも可）
CUSTOMER_CONFIG_PATH=

# 顧客JSONの再読込TTL秒（0: 毎リクエスト読み込み、未設定時はプロセス起動時のみ）
SITE_CONFIG_RELOAD_TTL_SECONDS=0
```

注意
- PUBLIC_ で始まるキーはクライアントに公開される。SECRET_KEY/RESEND_API_KEY は公開しないこと。

---

## 3. SSR 構成とアダプタ

目的: Astro Actions を稼働させるため SSR を有効化する。

実装指示
1) [astro.config.mjs](astro.config.mjs) を以下方針で更新
   - `output: 'server'` を指定
   - デプロイ先に応じたアダプタを選定（既定は Node アダプタ）。
   - 例: `@astrojs/node` を使用

2) 依存追加（参考コマンド）
   - `npm i -D @astrojs/node zod resend`

3) Nodeアダプタ例（設定イメージ、実装はコード変更時に反映）
   - [defineConfig()](astro.config.mjs:1) 内で `adapter: node()` を設定

---

## 4. Astro Actions 設計

目的: /contact のフォーム送信をサーバ側で受け、Turnstile を検証後に Resend 経由でメール送信する。

新規ファイル: [src/actions/index.ts](src/actions/index.ts)

エクスポート
- [contactSubmit()](src/actions/index.ts:1): お問い合わせ送信アクション
- [verifyTurnstile()](src/actions/index.ts:50): Turnstile サーバ側検証ヘルパ

バリデーション
- zod で以下を必須検証
  - name: string 1..100
  - email: email 形式
  - message: string 1..2000（長すぎ防止）
  - token: string（Turnstile応答）

処理フロー（サーバ）
1) [contactSubmit()](src/actions/index.ts:1) が `token` を [verifyTurnstile()](src/actions/index.ts:50) に渡して検証
2) 成功時に Resend を用い、`SITE_CONTACT_TO_EMAIL` 宛に内容を送付
3) 失敗時はエラーを返し、クライアント側でエラー表示

Mermaid（シーケンス）
```
sequenceDiagram
  participant U as User
  participant C as ContactForm
  participant A as Astro Actions
  participant T as Turnstile API
  participant R as Resend API
  U->>C: 入力 + 送信
  C->>A: contactSubmit(name,email,message,token)
  A->>T: token 検証
  T-->>A: ok / ng
  A->>R: メール送信
  R-->>A: ok
  A-->>C: 成功レスポンス
  C-->>U: /contact/thanks へ遷移
```

---

## 5. Contact ページ実装（Actions + Turnstile）

対象: [src/pages/contact.astro](src/pages/contact.astro), [src/components/forms/ContactForm.astro](src/components/forms/ContactForm.astro)

要件
- フォームは Astro Actions 呼出しを使用
- Turnstile ウィジェットを設置
- 送信成功で `/contact/thanks` へ遷移
- GTM イベント: 表示時に `form_view`、成功時に `form_submit`

実装ポイント
1) ページ表示時イベント
   - インラインスクリプトで `dataLayer.push({ event: 'form_view' })` を条件的に実装
   - 実装箇所: [src/pages/contact.astro](src/pages/contact.astro)
2) フォーム
   - Actions 参照: `import { actions } from 'astro:actions'`
   - `<form method="POST" action={actions.contactSubmit}> ... </form>` を構成（[contactSubmit()](src/actions/index.ts:1)）
   - Turnstile
     - `<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>` をレイアウトに挿入
     - `<div class="cf-turnstile" data-sitekey={import.meta.env.PUBLIC_TURNSTILE_SITE_KEY}></div>` をフォーム内に設置
   - 送信時
     - 成功: `Astro.redirect('/contact/thanks')` を使用
     - 失敗: エラーメッセージをフォーム下部に表示

Thanks ページ
- 新規: [src/pages/contact/thanks.astro](src/pages/contact/thanks.astro)
- 表示時に `dataLayer.push({ event: 'form_submit' })` を実行
- CTA: 予約/トップへ戻る など（`data-gtm="reserve"` 推奨）

---

## 6. GTM 拡張イベントの実装

採用イベント（GTM対応仕様書準拠）
- `click_reserve`（予約・問い合わせ導線）
- `click_menu`（メニュー閲覧）
- `click_access`（アクセス確認）
- `form_view`（Contact 表示）
- `form_submit`（送信完了）

実装ルール
- クリック系は data-gtm 属性を付与し、GTM 側で Click Trigger で拾う
  - 例: `data-gtm="reserve"` → click_reserve
  - 例: `data-gtm="menu"` → click_menu
  - 例: `data-gtm="access"` → click_access
- フォーム系は表示/完了ページで `dataLayer.push` を最小出力

反映箇所
- ヘッダー
  - [src/components/layout/Header.astro](src/components/layout/Header.astro):
    - サービス（/service）リンクに `data-gtm="menu"`
    - 料金（/price）リンクに `data-gtm="menu"`（同カテゴリ扱い）
    - お問い合わせ（/contact）CTAに `data-gtm="reserve"`
- フッター
  - 予約/問い合わせ系導線に `data-gtm="reserve"`
  - Access は今回未公開のため、追加時に `data-gtm="access"` を付与

GTM埋込
- レイアウト（[src/layouts/BaseLayout.astro](src/layouts/BaseLayout.astro) or [src/layouts/MarketingLayout.astro](src/layouts/MarketingLayout.astro)）で `PUBLIC_GTM_CONTAINER_ID` 存在時のみ GTM スニペットを注入

---

## 7. ナビゲーションとページ構成

ヘッダー（日本語固定 / 単階層）
- サービス → `/service`
- 料金 → `/price`
- お問い合わせ → `/contact`

実装
- ナビ配列定義: [src/config/navigation.ts](src/config/navigation.ts)
- 表示/クリック属性: [src/components/layout/Header.astro](src/components/layout/Header.astro)

ページ
- サービス: 新規 [src/pages/service.astro](src/pages/service.astro)
  - 既存セクション（例: [src/components/sections/marketing/FeaturesSection.astro](src/components/sections/marketing/FeaturesSection.astro) 等）を流用
- 料金: 新規 [src/pages/price.astro](src/pages/price.astro) を作成し、[src/pages/pricing.astro](src/pages/pricing.astro) を流用
  - 実装案: `export { default as prerender } from './pricing.astro'` は不可のため、`export { default } from './pricing.astro'` で再エクスポート
  - canonical は /price 優先（[SEO.astro](src/components/common/SEO.astro) で制御）
- お問い合わせ: 既存 [src/pages/contact.astro](src/pages/contact.astro) を Actions 仕様に刷新
- Thanks: 新規 [src/pages/contact/thanks.astro](src/pages/contact/thanks.astro)

トップ、Access について
- 今回は必須外。導線/フッターは将来対応で拡張

---

## 8. レイアウト変更（GTM + Turnstile）

対象: [src/layouts/BaseLayout.astro](src/layouts/BaseLayout.astro)（または [src/layouts/MarketingLayout.astro](src/layouts/MarketingLayout.astro)）

追加
- GTM: `PUBLIC_GTM_CONTAINER_ID` がある場合のみ `<script>` 挿入（head/body両方）
- Turnstile: APIスクリプト `<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>` をフッター直前で読み込み

---

## 9. SEO/OGP 共通化

対象: [src/components/common/SEO.astro](src/components/common/SEO.astro)

要件
- title/description/canonical/OGP を各ページから一元管理
- /price 優先の canonical を設定
- Organization の JSON-LD（将来 LocalBusiness に拡張可）

---

## 10. 品質担保（スモークテスト）

ビルド/起動
- `npm run build` が成功すること

ランタイム検証
- 200: `/service`, `/price`, `/contact`, `/contact/thanks`
- GTM: `PUBLIC_GTM_CONTAINER_ID` 設定時のみスニペット出力
- フォーム: Turnstile 表示、エラー時に送信不可、成功時に thanks 遷移
- イベント: contact 表示で `form_view`、thanks 表示で `form_submit` が dataLayer に積まれる

---

## 11. 実装タスクリスト（実行順）

1) SSR化と依存導入
   - [astro.config.mjs](astro.config.mjs) を `output: 'server'` + Nodeアダプタ設定
   - 依存追加: @astrojs/node zod resend
   - [.env.example](.env.example) を更新

2) GTM/Turnstile のレイアウト対応
   - [src/layouts/BaseLayout.astro](src/layouts/BaseLayout.astro) に GTM 条件埋め込み
   - 同レイアウトに Turnstile API スクリプトを追加

3) Actions 追加
   - 新規 [src/actions/index.ts](src/actions/index.ts) に [contactSubmit()](src/actions/index.ts:1) と [verifyTurnstile()](src/actions/index.ts:50)

4) Contact 改修 + Thanks 追加
   - [src/pages/contact.astro](src/pages/contact.astro) を Actions 呼出しに変更、表示時 `form_view`
   - 新規 [src/pages/contact/thanks.astro](src/pages/contact/thanks.astro)（表示時 `form_submit`）

5) ナビ/ページ
   - [src/config/navigation.ts](src/config/navigation.ts) を日本語固定3件に更新
   - 新規 [src/pages/service.astro](src/pages/service.astro)
   - 新規 [src/pages/price.astro](src/pages/price.astro)（[src/pages/pricing.astro](src/pages/pricing.astro) を再エクスポート）
   - ヘッダーの data-gtm 属性を付与（[Header.astro](src/components/layout/Header.astro)）

6) SEO整備
   - [src/components/common/SEO.astro](src/components/common/SEO.astro) で canonical / OGP を整理（/price 優先）

7) スモークテスト
   - 主要URLの 200
   - GTM 条件埋め込み確認
   - Turnstile/Resend 疎通（ResendはテストAPIキーでドライラン）

---

## 12. 参考コードシグネチャ（疑似・雛形）

- Actions 定義（簡略概念）: [contactSubmit()](src/actions/index.ts:1)
```
import { defineAction } from 'astro:actions';
import { z } from 'zod';
import { Resend } from 'resend';

export const contactSubmit = defineAction({
  accept: 'form',
  input: z.object({ name: z.string().min(1).max(100), email: z.string().email(), message: z.string().min(1).max(2000), token: z.string() }),
  handler: async ({ name, email, message, token }) => {
    const ok = await verifyTurnstile(token); // see below
    if (!ok) throw new Error('turnstile_failed');
    const resend = new Resend(import.meta.env.RESEND_API_KEY);
    await resend.emails.send({ to: import.meta.env.SITE_CONTACT_TO_EMAIL, from: 'no-reply@yourdomain.tld', subject: `[Contact] ${name}`, text: `${name} <${email}>
\n${message}` });
    return { success: true };
  }
});
```

- Turnstile 検証: [verifyTurnstile()](src/actions/index.ts:50)
```
export async function verifyTurnstile(token: string): Promise<boolean> {
  const secret = import.meta.env.TURNSTILE_SECRET_KEY;
  const resp = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ secret, response: token })
  });
  const data = await resp.json();
  return !!data.success;
}
```

- /price 再エクスポート: [src/pages/price.astro](src/pages/price.astro)
```
export { default } from './pricing.astro';
```

---

## 13. データモデルと顧客JSON反映（重要）

目的: 顧客JSONの更新でサイト文言・構成が反映されることを設計として明記し、実装一点化する。

データ配置と読込
- 既定デフォルト: `src/content/site.default.json` を用意（初期テンプレ値）
- 顧客JSON: `.env` の `CUSTOMER_CONFIG_PATH` で指定
  - 例: `CUSTOMER_CONFIG_PATH=./customer/sample.customer.json`
  - 外部URLを指定する場合は SSR サーバから取得可能なパスとする

ローダーモジュール（新規）
- [getSiteData()](src/lib/site-data.ts:1): 有効構成を返すファサード
- [readCustomerConfig()](src/lib/site-data.ts:50): `CUSTOMER_CONFIG_PATH` を解決して JSON を取得（ファイル or HTTP）
- [mergeWithDefaults()](src/lib/site-data.ts:90): 既定 JSON と顧客 JSON をディープマージ
- [siteSchema()](src/lib/site-schema.ts:1): Zod スキーマで構造/型バリデーション
- [forbidWords()](src/lib/site-schema.ts:80): 医療・効果断定ワードの簡易検出（任意、CI側と重複可）
- 返却型: [SiteData](src/lib/types.ts:1)

キャッシュ/反映ポリシー（SSR）
- `.env` の `SITE_CONFIG_RELOAD_TTL_SECONDS` に従い、SSR プロセス内で TTL キャッシュ
  - `0` → 毎リクエストで再読込（開発/即時反映向け）
  - 未設定 or 負値 → プロセス起動時のみ読込（本番/安定運用向け）
  - 実装例: モジュールスコープに `let cache: { data: SiteData; ts: number } | null` を保持し、TTLを超過時に再フェッチ

ページ/コンポーネントでの適用方針
- 各ページのサーバ側で [getSiteData()](src/lib/site-data.ts:1) を取得し、UIへ props 受け渡し
  - 例: トップ/サービス/料金/お問い合わせの Hero/CTA/Features はすべて SiteData から参照
  - 直書き禁止（本書の規定により、可変文言は SiteData からのみ）
- SEO/OGP
  - [SEO.astro](src/components/common/SEO.astro) の title/description/canonical を SiteData とページ固有情報から合成
  - brand.name/brand.area による自動タイトル生成を許可（上書き可）

キー最小セット（再掲）
- brand: name/tagline/area/phone/lineUrl/instagramUrl/address
- service: primaryOffer/features[]/menu[]
- cta: primaryText/primaryUrl

失敗時の挙動
- スキーマ不一致 or 禁止語検出時
  - サーバログに警告を出し、該当キーはデフォルトへフォールバック
  - SSR を落とさない（可用性優先）。厳格運用は CI/CD 側の検証で担保

疑似コード（抜粋）: [getSiteData()](src/lib/site-data.ts:1)
```
import fs from 'node:fs/promises';
import { z } from 'zod';
import def from '../content/site.default.json';
import { siteSchema } from './site-schema';

let cache: { data: SiteData; ts: number } | null = null;

export async function getSiteData(): Promise<SiteData> {
  const ttl = Number(import.meta.env.SITE_CONFIG_RELOAD_TTL_SECONDS ?? -1);
  const now = Date.now();
  if (cache && ttl >= 0 && now - cache.ts < ttl * 1000) return cache.data;
  const customer = await readCustomerConfig();
  const merged = mergeWithDefaults(def, customer);
  const parsed = siteSchema().parse(merged);
  cache = { data: parsed, ts: now };
  return parsed;
}
```

ページ側適用例（概念）: [service.astro](src/pages/service.astro:1)
```
---
import { getSiteData } from "../lib/site-data";
const site = await getSiteData();
const features = site.service.features;
---
```

実装タスクリスト（追補）
- 新規: [src/content/site.default.json](src/content/site.default.json)
- 新規: [src/lib/site-data.ts](src/lib/site-data.ts)
- 新規: [src/lib/site-schema.ts](src/lib/site-schema.ts)
- 既存: 各ページ/コンポーネントからの直書きを SiteData 参照へ置換

---

以上の設計に従い、実装・差分反映を行うこと。

---


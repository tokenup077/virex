
---

# CI/CDパイプライン仕様書（Astro・マルチテナント自動デプロイ）

## 0. 目的

* 顧客設定（Customer JSON）を入力として、**自動でビルド・デプロイ・検証・公開**まで完結させる
* 更新（年1回／即時有償／CMS News）も同一パイプラインで処理する
* 例外時は人手対応ではなく、**バリデーション・差し戻し・ロールバック**で運用を固定化する

---

## 1. パイプライン方式（結論）

### 1.1 デプロイ単位（推奨）

**方式A：1顧客＝1デプロイ（1サイト）** を推奨。

* 顧客ごとに `base_url` / サブドメインを割当
* 顧客ごとにビルド成果物を分離
* 影響範囲が狭く、障害切り分けが容易
* 将来テンプレ追加でも拡張しやすい

※方式B（1ビルドで複数顧客をまとめて生成）は初期は避ける（障害時の巻き添えが大きい）。

---

## 2. リポジトリ・ブランチ戦略

### 2.1 リポジトリ分割（最小）

* `template-repo`：Astroテンプレ本体（共通）
* `customer-config`：顧客JSON・状態（顧客データ）

初期は1リポジトリでもよいが、個人情報・運用分離の観点で**分割を推奨**。

### 2.2 ブランチ

* `main`：本番テンプレ
* `release/*`：必要なら固定（テンプレ変更の安定運用用）
* `hotfix/*`：緊急修正

顧客ごとのブランチは作らない（運用負債になるため）。

---

## 3. トリガー（起動条件）

### 3.1 初回公開（Provisioning）

* `payment_succeeded` → State Machine が `PROVISIONING` を開始
* `customer-config` に顧客JSONが作成（または更新）された時点で CI を起動

### 3.2 更新（Updating）

* `update_form_submitted` → `UPDATE_REQUESTED`
* 更新ウィンドウ到来 or 即時有償 → `UPDATING` として CI 起動

### 3.3 テンプレ改修（Template release）

* `template-repo main` のマージでパイプライン起動
* 対象顧客は **段階リリース**（全顧客一斉は避ける）

---

## 4. ジョブ構成（Stages）

パイプラインは以下のステージで固定する。

1. **Fetch Config**
2. **Validate**
3. **Build**
4. **Deploy (Staging)**
5. **Smoke Test**
6. **Promote to Production**
7. **Notify + State Update**
8. **Rollback（失敗時）**

---

## 5. ステージ詳細仕様

## 5.1 Fetch Config（設定取得）

### 入力

* `customer_id`
* `CUSTOMER_CONFIG_PATH` もしくは `customer-config` の参照
* `DEPLOY_ENV`（staging / prod）

### 出力

* `customer.json`（ビルド用にローカル配置）
* `effective_config.json`（defaultsとマージした最終設定）

---

## 5.2 Validate（バリデーション）

### 実行内容

* JSON Schema 検証
* 必須項目検証
* 文字数制限
* URL/メール/郵便番号形式
* 禁止語フィルタ（医療・効果断定）

### 成功条件

* exit code 0

### 失敗時

* パイプライン停止
* State Machine に `validation_failed` を返す
* 顧客へ差し戻し通知（修正箇所一覧を添付）

---

## 5.3 Build（Astro静的ビルド）

### 実行内容

* `npm ci`
* `npm run build`（SSG）
* `GTM_CONTAINER_ID` があれば埋込、なければ無効化
* SEO meta / OGP / LocalBusiness JSON-LD 生成

### 出力成果物

* `dist/`（静的ファイル一式）
* `build_manifest.json`（ビルド情報：テンプレバージョン、customer_id、timestamp）

### 失敗時

* State Machine に `deploy_failed` 相当を返す
* 自動リトライ（最大R回、指数バックオフ）

---

## 5.4 Deploy (Staging)（ステージングへデプロイ）

### 方針

* **本番への直接デプロイは禁止**
* 必ずステージングURL（またはプレビューURL）に配置して検証する

### 出力

* `staging_url` を生成・記録

### 失敗時

* リトライ（最大R回）
* 上限到達で運営通知

---

## 5.5 Smoke Test（自動動作確認）

### テスト項目（最低限・固定）

1. 主要ページが200

   * `/` `/menu` `/access` `/contact` `/privacy`
2. `LocalBusiness` JSON-LD が出力されている
3. 主要導線要素が存在する（data-gtm属性）
4. Contactフォームのエンドポイント設定が存在する（URL形式）
5. OGPタグが存在する（og:title/description/image/url）

※ 実際のフォーム送信テストは、環境により「疑似送信」または「疎通確認」に限定可。

### 失敗時

* `deploy_failed` / `smoke_test_failed` を State Machine に返す
* ロールバック（staging破棄）
* 入力起因なら差し戻し、テンプレ起因なら運営通知

---

## 5.6 Promote to Production（本番昇格）

### 方針

* ステージング検証成功を前提に、本番へ昇格
* 方式は以下どちらかで固定（どちらでも可）

#### 方式P1：Atomic Swap（推奨）

* 本番の参照先を新しい成果物に切替（ゼロダウンタイム）

#### 方式P2：Blue/Green

* Blue/Green環境を切替

### 失敗時

* 直前の安定版へロールバック
* State Machine に `provision_failed/update_failed` を返す

---

## 5.7 Notify + State Update（通知・状態更新）

### 実行内容

* State Machine の状態遷移

  * 初回：`LIVE`
  * 更新：`LIVE`（戻し）
* 顧客への通知メール（公開URL／運用ルール／更新ルール）

### 失敗時

* デプロイ自体は成功しているため、通知のみ再試行
* 再試行上限で運営通知（顧客体験上の損失があるため）

---

## 5.8 Rollback（失敗時）

### ロールバック対象

* 本番昇格後に検知された重大不具合
* スモークテストは通ったが、追加の監視で異常判定

### ロールバック方式

* 前回の `build_manifest` を参照し、直前安定版へ切替

---

## 6. 環境変数・シークレット管理

### 6.1 必須環境変数（例）

* `CUSTOMER_ID`
* `CUSTOMER_CONFIG_PATH`（またはconfig取得用キー）
* `SITE_BASE_URL`
* `GTM_CONTAINER_ID`（任意）
* `DEPLOY_ENV`

### 6.2 シークレット（例）

* デプロイ先の認証情報
* フォームAPIキー（Contact送信先）
* 通知メール送信用キー

### 方針

* すべてCIのシークレットストアで管理
* リポジトリに平文を置かない

---

## 7. ログ・監査（必須）

### 7.1 ログ出力

* `customer_id`
* 状態（state）
* テンプレバージョン
* バリデーション結果（どの項目がNGか）
* デプロイURL（staging/prod）
* スモークテスト結果

### 7.2 顧客へ見せるログ範囲

* 差し戻しの理由（項目名・修正方法）
* 内部URLやシークレットは非公開

---

## 8. テンプレ更新のリリース方針（巻き込み防止）

### 8.1 段階リリース（必須）

* まず社内検証用の “Canary顧客” へ適用
* 次に新規顧客のみ
* 最後に既存顧客へ（更新タイミングに合わせる）

### 8.2 既存顧客への自動再デプロイ禁止

* 既存顧客は原則、更新申請のタイミングでテンプレ更新を取り込む
  （放置運用を崩さないため）

---

## 9. 失敗時の扱い（運用ルール）

### 9.1 入力起因

* 自動差し戻し（FORM_PENDING / UPDATE_REQUESTEDへ）
* 顧客が再入力するまで停止

### 9.2 基盤起因（テンプレ・CI障害）

* 自動リトライ（最大R回）
* 上限到達で運営通知（例外介入）

---

## 10. KPI（CI/CDフェーズ）

| 指標            | 目標     |
| ------------- | ------ |
| 初回デプロイ成功率     | 95%以上  |
| 自動差し戻しで解決     | 90%以上  |
| ロールバック発生率     | 1%以下   |
| 1顧客あたりのデプロイ工数 | 0（自動）  |
| 公開までの時間       | 10〜60分 |

---

## 11. 成果物（チェックリスト）

* [ ] `effective_config.json` 生成
* [ ] バリデーション（schema＋禁止語）をCIで強制
* [ ] staging→smoke test→prod の昇格フロー
* [ ] ロールバックができる
* [ ] State Machineと通知が連動する

---


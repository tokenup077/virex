
---

# 顧客JSONスキーマ仕様書

（リラクゼーションサロン・初期業種版）

---

## 0. 設計方針

* **1顧客＝1 JSON**
* サイト生成に必要な情報をすべて含む
* 未入力でも成立（デフォルトあり）
* 人が読める構造（デバッグ容易）
* 将来 Business OS へ拡張可能

---

## 1. JSON 全体構造（概要）

```json
{
  "customer": {},
  "plan": {},
  "site": {},
  "content": {},
  "menu": {},
  "contact": {},
  "seo": {},
  "analytics": {},
  "cms": {},
  "status": {}
}
```

---

## 2. customer（顧客基本情報）

```json
"customer": {
  "customer_id": "auto",
  "shop_name": "〇〇リラクゼーションサロン",
  "area_name": "〇〇市",
  "email": "example@example.com"
}
```

### 仕様

| key         | 必須 | 制約     |
| ----------- | -- | ------ |
| customer_id | ○  | 自動発行   |
| shop_name   | ○  | 最大50文字 |
| area_name   | ○  | 最大30文字 |
| email       | ○  | メール形式  |

---

## 3. plan（契約情報）

```json
"plan": {
  "type": "annual",
  "start_date": "2025-04-01",
  "end_date": "2026-03-31"
}
```

### type 値（固定）

* `trial_6m`
* `annual`
* `3y`
* `5y`

※ type により CMS 可否・更新頻度を制御

---

## 4. site（サイト設定）

```json
"site": {
  "domain_mode": "subdomain",
  "subdomain": "sample",
  "custom_domain": null,
  "base_url": "https://sample.example.com"
}
```

### 仕様

| key           | 制約                        |
| ------------- | ------------------------- |
| domain_mode   | subdomain / custom_domain |
| subdomain     | 英小文字・数字・ハイフン              |
| custom_domain | custom_domain時のみ          |

---

## 5. content（固定ページ文言）

```json
"content": {
  "catch_copy": "心と体をゆったりと整えるリラクゼーションサロンです",
  "intro_text": null,
  "features": [
    "完全予約制のプライベート空間",
    "落ち着いた雰囲気の施術ルーム",
    "お一人おひとりに合わせた丁寧な対応"
  ]
}
```

### 仕様

* null = デフォルト採用
* features は **常に3要素**

---

## 6. menu（メニュー）

```json
"menu": [
  {
    "name": "全身リラクゼーション",
    "duration": 60,
    "price": 6000,
    "note": null
  }
]
```

### 制約

| 項目       | 制約     |
| -------- | ------ |
| name     | 選択式    |
| duration | 任意・数値  |
| price    | 必須・数値  |
| note     | 最大50文字 |

---

## 7. contact（問い合わせ設定）

```json
"contact": {
  "form_enabled": true,
  "intro_text": null
}
```

※ フォーム構造自体は固定

---

## 8. seo（SEO設定）

```json
"seo": {
  "title_override": null,
  "description_override": null
}
```

### 仕様

* null → 自動生成
* 上書きは **文字数制限あり**
* keywordsは持たない

---

## 9. analytics（GTM / GA）

```json
"analytics": {
  "gtm_container_id": null
}
```

### 仕様

* null → GTM無効
* ID形式チェックのみ

---

## 10. cms（CMS設定）

```json
"cms": {
  "enabled": false,
  "news": []
}
```

### enabled 条件

* plan.type が `3y` or `5y` のみ true 許可

### news 制約

| 項目  | 制約    |
| --- | ----- |
| 件数  | 最大10  |
| 文字数 | 最大300 |
| 画像  | 1枚まで  |

---

## 11. status（内部管理用）

```json
"status": {
  "state": "LIVE",
  "last_updated": "2025-04-01T12:00:00Z"
}
```

※ 顧客非公開

---

## 12. バリデーションルール（要点）

### 必須チェック

* shop_name
* area_name
* address（siteに含めてもOK）
* business_hours（拡張可）

### 禁止語チェック（content / menu / cms）

* 治療
* 改善
* 効果
* 医療

### 失敗時

* JSON保存しない
* FORM_PENDING へ戻す
* 自動差し戻し通知

---

## 13. 完了条件（この成果物のKPI）

* フォーム項目 = JSONキー 1対1
* 人手編集不要
* 例外はスキーマで弾ける
* 将来業種追加時も拡張可能

---


# Skill Market Creator Pro — デザインシステム

このアプリの見た目に関する唯一の正本。実装トークンは [index.css](index.css) にあり、
このドキュメントは「いつ・何を・なぜ使うか」を定義する。

## 設計思想

**「静かなニュートラルの上に、ブランドの桃色グラデーションがひとさし」**

- ベース（背景・カード・本文・枠線）は stone 系ニュートラルに徹する。画面の9割はここ。
- ブランドの魂は `orange-400 → rose-500 → purple-600` のグラデーション。
  ただし**1画面につき最重要のアクション1つ（＋ワードマーク）だけ**に許可する。
- rose 単色はアクセント（選択状態・アイラベル・ホバーのにじみ・フォーカス）に使う。
- 迷ったらニュートラル。色を足す前に「これは画面で一番大事か？」を問う。

## カラー

| トークン | 値 | 用途 |
| --- | --- | --- |
| `brand-50〜700` | rose系（#fff1f2〜#be123c） | アクセント。選択状態・eyebrow・ホバー・フォーカスリング |
| `--gradient-brand` | orange-400 → rose-500 → purple-600 | **Primary CTA とワードマークのみ** |
| `--gradient-brand-soft` | orange-50 → rose-50 | 特別な強調面（使用は控えめに） |
| `stone-50` | 背景 | body背景（上部に桃色のにじみ） |
| `stone-900` | 墨 | 見出し文字・Darkボタン |
| `stone-500/400` | グレー | 本文補足・ラベル |
| `stone-200/100` | 枠線・面 | カード枠・区切り・無効状態 |
| `emerald-600/50` | 成功 | 「作成済み」等の完了ステータスのみ |

### 禁止事項
- グラデーションをボタン2つ以上・バッジ・枠線・アイコンに使わない
- rose 以外のアクセント乱用（blue/teal/sky/amber などの虹色バッジ）は禁止
- 絵文字をUIクローム（ボタン・見出し・ラベル）に使わない。生成コンテンツ内は可

## ボタン（[index.css](index.css) の `@layer components`）

| クラス | 見た目 | 用途 | 画面内の数 |
| --- | --- | --- | --- |
| `.btn-primary` | ブランドグラデーションのピル + rose影 | その画面の最重要アクション（生成する・出品画面へ） | **最大1** |
| `.btn-dark` | 墨(stone-900)のピル | 実務アクション（実行・コピー・コード生成） | 複数可 |
| `.btn-secondary` | 白ピル+枠線。ホバーで rose がにじむ | 戻る・外部リンク・補助操作 | 複数可 |
| `.btn-quiet` | グレー面ピル | キャンセル・消極的操作 | 複数可 |

- サイズはユーティリティで付与（例: `px-6 py-3 text-sm`）。形は常にピル（rounded-full）。
- `disabled` は自動でグレー化（`.btn:disabled`）。

## その他のコンポーネントクラス

| クラス | 用途 |
| --- | --- |
| `.text-brand-gradient` | ワードマーク「Creator Pro」とヒーロー見出しの一部のみ |
| `.eyebrow` | セクション上の小ラベル（STEP 1 / SUPPORT 等）。rose-500 |
| `.card` | 標準の白カード（rounded-2xl + stone-200/80枠） |
| `.card-hoverable` | クリック可能なカード。ホバーで rose 枠 + 浮く影 |
| `.chip` / `.chip-active` | トグル・選択チップ。選択中は rose-500 塗り |
| `.field` | 入力欄。stone-50面 → フォーカスで白面 + rose枠 + rosew淡リング |

## タイポグラフィ

- フォント: Inter + ヒラギノ（`--font-sans`）。`palt` で日本語を詰め組み
- ページタイトル: `text-xl md:text-2xl font-bold text-stone-900 tracking-tight`
- セクション見出し: `text-lg font-bold text-stone-900`
- 本文: `text-sm text-stone-600 leading-relaxed`、補足: `text-xs text-stone-400`
- グラデーション文字は `.text-brand-gradient`（font-bold 以上で使う）

## 形・影・動き

- 角丸: カード `rounded-2xl`、外殻 `rounded-3xl`、ボタン/チップ `rounded-full`。それ以外の値は使わない
- 影: `shadow-soft`（静置）/ `shadow-card`（外殻）/ `shadow-card-hover`（ホバー）/ `shadow-brand`（Primaryのみ）
- モーション: `ease-smooth`・200〜300ms。ホバーは「0.5px浮く or 枠が色づく」まで。scale/pingの多用禁止
- フォーカス: rose の2pxアウトライン（`:focus-visible`、キーボード操作時のみ）

## 状態の色

| 状態 | 表現 |
| --- | --- |
| 選択中 | rose-500 塗り（`.chip-active`）または rose枠 + `選択中` バッジ |
| 完了・作成済み | `bg-emerald-50 text-emerald-700` バッジ |
| コピー済み | `bg-brand-50 text-brand-600`（2秒で戻る） |
| 無効 | `bg-stone-100 text-stone-400` |
| エラー通知 | 墨のトースト（画面下部・5秒） |

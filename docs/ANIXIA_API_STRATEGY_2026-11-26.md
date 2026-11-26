# ANIXIA API選定・データ取得方針

更新日: 2026-11-26

## 目的

ANIXIAで利用する外部APIを、情報品質・日本語対応・利用条件・安定性・費用・保守負荷で評価し、役割の重複と不要な定期実行を減らす。

APIは数を増やすのではなく、1つの情報項目に対して主担当ソースを原則1つ定め、補完ソースは不足項目だけに使う。

## 1. 本番DBの現状（2026-11-26読み取り監査）

- `public.anime`: 10,032件
- 公開作品: 8,615件
- 公開作品の日本語タイトル: 8,615件
- 公開作品のポスター: 5,019件（58.3%）
- 公開作品のあらすじ: 0件
- 公開作品の公式サイトURL: 3,094件
- `anime_external_ids`: Wikidata 8,767件、MyAnimeList 6,437件、AniList 3,361件
- 公開ポスター5,019件はすべて `poster_source='anilist'`
- TMDB/Commons由来の公開ポスターは現時点で0件
- `anime.source` は Wikidata 8,413件、AniList 1,609件、ANIXIA curated 10件
- Annict由来の正規作品レコード・外部IDは現時点の集計で確認できない

件数は取得時点の実測値であり、今後変動する。

## 2. APIごとの採否

### Wikidata — 採用（基礎メタデータ）

用途:
- 作品候補発見
- 日本語・英語タイトル、別名、開始日、話数、公式サイト等の構造化項目
- Wikidata QIDによる外部ID連携
- 人物・制作組織の識別情報の補完

条件・注意:
- 構造化データはCC0。画像・あらすじ本文の利用許諾を意味しない。
- SPARQL Query Serviceは60秒のクエリ期限、クライアントごとの処理時間制限、同時実行数制限がある。大規模な全件走査を短い間隔で繰り返さない。
- SPARQLは候補発見・ID一覧取得に限定し、詳細情報はWikidata Action APIのエンティティ取得で必要分だけ取得する。
- 1つのワーカーで順次実行し、User-Agent、Retry-After、指数バックオフ、カーソル保存を必須にする。
- Wikidataだけで作品の正確性・収録適格性を確定しない。日本語タイトル欠落、作品形式不明、重複疑いは審査キューへ送る。

採否: 継続採用。ANIXIAの広範な構造化カタログの基盤。

### Annict — 採用（日本語作品・放送・エピソード情報）

用途:
- 日本語タイトル・読み・メディア形式
- 作品・エピソード・放送関連情報
- Wikidataの不足項目の補完
- 将来の視聴記録連携（別途OAuthと個人情報設計を審査）

2026-11-25施行のAPI利用規約を適用する。
- APIは無料。規約順守の範囲で商用利用も可能。
- 作品情報はアプリケーション提供に必要な範囲で保存・キャッシュできる。
- 取得データをそのままの形やまとまったデータとして、第三者が取り出せる公開データセット・独自APIとして再配布しない。
- Webアプリではサーバー側で検索し、必要な範囲だけ返す。
- 画像URLはAnnictが利用許諾できるものではない。ポスター・バナー画像の取得元にしない。
- 共用トークンを使う場合はreadスコープのみとし、Supabase Edge Function Secretsに保管する。ブラウザへ露出させない。
- APIのレート制限は変更され得る。現行Developer Helpでは認証あり600リクエスト/分（トークンとIPの組）、認証なし60/分。大量取得は並列化せず逐次実行し、時間を分ける。放送中・放送前は1日1回、終了作品は週1回〜月1回を目安とする。

現状:
- Edge Function `sync-annict-catalog` は存在するが、現在の正規作品レコード・外部ID集計ではAnnict由来データを確認できない。
- 定期実行ジョブも確認できない。まず少数作品で認証・規約・フィールド対応・重複照合を検証し、その後に限定的な同期を開始する。

採否: 条件付きで主な日本語補完ソースとして採用。

### Syoboi Calendar — 採用（日本の放送・話数補助）

用途:
- 日本のTV放送予定・番組・エピソード情報
- Annictや公式放送情報で不足する放送局・話数の補完
- 既存のSyoboi TIDによる作品照合

条件・注意:
- 公式ヘルプではコピーやアプリケーションによる自動取得を許容している。
- 専用User-Agentを設定する。
- データは手入力で、1週間以上先の放送予定は誤りの可能性が高いと明記されている。
- 未来の放送予定を確定情報として扱わず、公式放送局・公式サイトと区別する。
- 作品カタログ全体の正本にはせず、日本の放送・話数補助に限定する。
- 5分ごとの全件走査は避け、放送中の対象作品と未取得範囲に絞る。

採否: 継続採用。放送中作品の更新を中心に使用。

### Wikimedia Commons — 条件付き採用（ライセンス確認済み画像のみ）

用途:
- CC0、Public Domain、CC BY、CC BY-SA等、個別ファイルのライセンス条件を確認できる画像

条件・注意:
- ファイルごとに作者、ライセンス、ライセンスURL、説明ページ、変更有無を記録する。
- CC BY/CC BY-SAは必要な作者表示・ライセンス表示を必ず行う。
- Commonsにあることだけで、作品との一致や権利状態を保証しない。
- 作品ポスターが十分に見つかるとは限らない。
- 検索のたびにCommonsへ問い合わせるホットスパイダー方式を避け、定期バッチで候補を取得する。
- ライセンス情報を検証できない候補は公開しない。

採否: 条件付き採用。ポスターの主力供給元ではなく、合法的に再利用できる画像の補完元。

### TMDB — 条件付き採用（非商用・帰属表示・画像権利確認）

用途:
- 作品ポスター候補の照合
- 必要に応じた作品・TV情報の補完候補

条件・注意:
- 公式FAQでは非商用利用は無料だが、TMDBのデータ/画像を出典として表示することが条件。
- TMDBロゴと「This product uses the TMDB API but is not endorsed or certified by TMDB.」の表示をAbout/Credits等に設ける。
- TMDBはAPI内画像の著作権を所有していると主張していない。TMDBに画像があるだけでANIXIAが自由に再配布できるとは判断しない。
- 収益を主目的とする商用利用には別途商用ライセンスの確認が必要。
- APIのSLAは提供されていない。
- タイトル完全一致だけでなく、作品形式・公開年・シリーズ識別を照合し、曖昧な候補は自動公開しない。
- APIトークンはSupabase Edge Function Secretsに保存する。

現状:
- `sync-tmdb-posters` は実装されているが、公開ポスターのTMDB由来件数は0。
- 定期実行ジョブは確認できない。非商用条件と画像利用条件を確認後、少数の欠損作品で検証する。

採否: 条件付き採用。画像の権利確認を通過した場合のみ利用。

### AniList — ANIXIAでは利用停止（書面許諾が得られる場合を除く）

公式API利用規約は、AniList APIをバックアップ・データ保存・大量収集に使うことを禁止し、同種の競合・非補完サービス（アニメ/マンガのリスト・トラッカー等）でのAPI利用を禁止している。制限はAPIから提供される全データ（メディアデータを含む）に及ぶ。

ANIXIAはアニメデータベースであり、同種サービスに該当する可能性が極めて高い。ポスター照合だけに用途を限定しても、競合サービスでの利用制限が適用される可能性があるため、許諾を得ずに継続利用しない。

対応:
- 2026-11-26、Supabase Cron `anixia-anilist-poster-sync`（jobid 31、5分間隔）を停止し、停止状態を再確認した。
- 既存のAniList由来ポスター5,019件と外部ID3,361件は、直ちに一括削除せず、公開利用・保持可否を別途確認する。新規取得・同期・利用拡大は停止する。
- AniListから書面による許諾を得られない場合、既存の画像とIDを段階的に置換・除去する計画を作る。
- `sync-anilist-catalog` とその定期実行は既に無効化されている。

採否: 原則不採用。書面許諾が得られた場合のみ再評価。

### MyAnimeList API — 今は導入しない（ID照合のみ）

- 現DBにはMyAnimeList IDが6,437件あるが、これは現時点で公式MAL API同期を意味しない。
- MyAnimeListを参考サイトにすることと、MAL APIをデータ取得元にすることは別問題。
- 公式APIの現行利用条件、レート制限、保存・再配布条件、商用条件を一次資料で確認できるまで、新たな一括取得を始めない。
- 非公式・非公開API、モバイルアプリ解析、第三者プロキシをデータ取得の基盤にしない。

採否: 保留。既存IDは外部参照キーとしての出自・利用条件を確認する。

### Wikipedia本文・配信サービスのあらすじ — 自動転載しない

- Wikipedia本文の取り込み機能は無効のまま維持する。
- Prime Video、Netflix等の紹介文は、公開APIや転載許諾が確認できない限り自動取得・保存しない。
- あらすじを登録する場合は、権利者の公式サイト等で利用条件を確認し、出典URL・取得日・許諾/ライセンスを記録する。
- 出典を確認できない作品は空欄のままとし、独自のあらすじを自動生成して埋めない。

## 3. 採用するAPI構成（確定案）

| データ領域 | 主担当 | 補完 | 公開条件 |
|---|---|---|---|
| 作品候補・外部ID | Wikidata | Annict | 作品形式・日本語タイトル・重複審査 |
| 日本語タイトル・読み | Annict | Wikidata | 出典と更新日を記録 |
| 基本放送・話数 | Annict | Syoboi / 公式情報 | 情報源ごとに確度を分ける |
| 人物・制作組織 | Wikidata | Annict | 人物同一性・役割を確認 |
| ジャンル | ANIXIA正規マスター | Wikidata候補・Annict情報 | ANIXIA側の分類定義へ変換し審査 |
| ポスター | 権利者から許諾された公式素材 | Commons / 条件を満たすTMDB | ファイル単位で権利・出典確認 |
| あらすじ | 権利者公式情報（利用条件確認済み） | なし | 出典・利用条件が確認できる場合のみ |
| ユーザー評価・視聴履歴 | ANIXIA内部DB | ユーザー本人の連携 | 他サービスのユーザー情報を無断収集しない |

## 4. 共通のデータ取得アーキテクチャ

外部APIごとに独立した同期処理を増やすのではなく、共通の取り込みパイプラインを使う。

1. **Discover** — 新規候補と更新対象を検出する。
2. **Fetch** — 必要な項目だけAPIから取得する。
3. **Normalize** — ANIXIA共通形式に変換する。
4. **Match** — Wikidata QID、Annict ID、Syoboi TID、MAL ID、タイトル、年、形式で同一作品を照合する。
5. **Validate** — 欠損・形式不一致・重複・異常値を検出する。
6. **Review** — 曖昧な候補は非公開審査キューに保留する。
7. **Upsert** — 外部IDを一意キーとして冪等に保存する。
8. **Publish** — 公開基準を満たすレコードだけ公開する。
9. **Observe** — 成功・失敗・API応答・更新件数・所要時間を記録する。

フィールドごとに以下を保持する:
- source
- source_id / source_url
- fetched_at / last_verified_at
- revision_idまたは更新日時（取得可能な場合）
- license / attribution / license_url（画像・文章）
- confidence / review_status（照合が曖昧な場合）

APIが返した値で、ANIXIA管理者が検証・修正した値を無条件に上書きしない。手動修正値には保護フラグと根拠を残す。

## 5. 定期実行の見直し

現行Cronの読み取り監査で確認した頻度:
- Syoboi episodes: 5分ごと
- Commons posters: 5分ごと
- Wikidata auto-review: 10分ごと
- Wikidata episodes: 10分ごと
- Wikidata genres: 10分ごと
- Syoboi titles: 30分ごと
- Seasonal sync: 1日1回
- Catalog quality snapshot: 1日1回

直近ログでは、auto-reviewが短期間に多数回実行され、最新回で1,375候補を再評価しても公開更新は0件、うち1,338件が日本語タイトル不足で保留されていた。保留理由が変わっていない候補を毎回再評価するのは無駄が大きい。

推奨頻度:
- Annict: 放送中・放送前は1日1回、終了作品は週1回〜月1回。逐次取得。
- Syoboi: 放送中の対象作品は1〜3時間ごと、終了作品・過去情報は日次以下。全カタログ再走査を避ける。
- Wikidata discovery: 日次〜週次。候補発見後はQID単位で差分取得。
- Wikidata episodes: 週次〜月次。放送中の最新話数はSyoboi/Annictを優先。
- Wikidata genres: 初回バックフィル完了までカーソル付きバッチ、その後は週次〜月次。
- Commons posters: 1日1回以下の低頻度バッチ、または管理者が指定した欠損作品のみ。
- TMDB: 自動常時実行ではなく、ライセンス確認済みの欠損作品に対する限定バッチ。
- auto-review: 新規候補追加時に実行、または1時間〜1日単位。前回保留から根拠・ソースデータが変化した候補だけ再審査する。

すべてのジョブで同一ソースの同時実行を防ぎ、カーソル、最大実行時間、バッチ上限、429/5xx対応、指数バックオフ、再試行上限を共通化する。

## 6. 開発優先順位

### P0 — API規約・セキュリティ
1. AniListの新規同期を停止（実施済み）。
2. 既存AniList由来画像・IDの利用可否を確認し、置換計画を作る。
3. Annictのトークンがread-onlyであること、公開データの返却方式、レート制限処理を検証する。
4. TMDBの利用条件・ロゴ・表示文・画像権利の確認を完了する。
5. Edge Function Secrets以外に秘密鍵が露出していないことを確認する。

### P1 — データ取得の効率化
1. API共通アダプターと同期ランナーを設計する。
2. 取得済み・変更なしのレコードを再取得しない差分同期へ変更する。
3. 保留候補の再審査条件を改善する。
4. Cron頻度をAPIの更新特性に合わせて減らす。
5. APIごとの成功率・費用・更新件数・失敗理由を可視化する。

### P2 — 欠損データ補完
1. 日本語タイトル・読みの欠損を補完。
2. 公式サイトURLを補完。
3. 画像は権利条件を満たすものから補完。
4. あらすじは利用条件の確認できた公式出典だけを対象にする。
5. 人物・制作会社・声優・監督・配役の関連付けを補完。

## 7. 参考資料（一次資料優先）

- Annict API利用規約: https://annict.com/terms/api
- Annict レート制限: https://wikino.app/s/annict/pages/419
- AniList API Terms of Use: https://docs.anilist.co/guide/terms-of-use
- AniList Rate Limiting: https://docs.anilist.co/guide/rate-limiting
- Wikidata Query Service User Manual: https://www.mediawiki.org/wiki/Wikidata_Query_Service/User_Manual
- Syoboi Calendar Help: https://docs.cal.syoboi.jp/about/
- TMDB API FAQ: https://developer.themoviedb.org/docs/faq
- TMDB API Rate Limiting: https://developer.themoviedb.org/docs/rate-limiting
- Wikimedia Commons reuse guidance: https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia
- Supabase pricing: https://supabase.com/pricing
- Supabase breaking changes: https://supabase.com/changelog?types=breaking-change

## 8. 変更履歴

- 2026-11-26: 本番DB、Edge Functions、Cron、Supabase Advisors、外部API利用規約を読み取り監査。
- 2026-11-26: AniListポスター同期Cron（jobid 31）を停止し、停止状態を再確認。`catalog_sources` も無効・pendingへ変更。
- 2026-11-26: TMDB同期関数にソース承認チェックを追加し、Supabase Edge Function version 6としてデプロイ。現在TMDBソースは未承認のため同期不可。
- 2026-11-26: Wikidata auto-reviewを毎時、Wikidata episode syncを30分ごとに変更。バックフィル完了後にさらに低頻度化する。
- 2026-11-26: この文書はAPI方針の設計資料。既存ポスター・外部ID・作品レコードの一括削除やスキーマ変更は行っていない。

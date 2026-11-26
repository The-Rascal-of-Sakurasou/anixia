# ANIXIA Phase 0: migration / schema reconciliation

監査日: 2026-11-26  
対象: `main`、Supabase production project `trvnxggqzlhqdhoyiliy`  
方法: GitHub migration inventory、Supabase migration history、production catalogの読み取り専用照合  
本書は2026-11-26時点の監査記録。production DB、migration履歴、Cron、Edge Functionsは変更していない。

## 1. 結論

**現行の `supabase/schema-snapshot` は2026-11-17時点の古いスナップショットであり、現在の本番DBを表していない。** また、Gitのmigrationファイルと本番migration履歴には、ファイル名・version・内容の不一致がある。

このため、現状のmigrationディレクトリをそのまま新規DBに適用することも、schema snapshotを現在の本番DBの完全な復元資料として使うこともできない。

当面の方針:
- 本番migration履歴をrepairしない。
- migrationファイルを削除・改名しない。
- pending扱いのファイルを本番へ適用しない。
- 現在の本番スキーマを最新のschema-only snapshotとして再取得し、隔離環境で再生できる状態を先に作る。
- migration chainの整理は、各SQLの効果と本番の現状を対応付けてから行う。

## 2. Git migrationと本番履歴の照合

| 指標 | 件数 |
|---|---:|
| GitHub `supabase/migrations` 内のSQLファイル | 117 |
| 本番 `schema_migrations` の適用履歴 | 109 |
| ファイルversionと本番versionが完全一致 | 47 |
| ファイル名のmigration名が本番履歴名と一致 | 79 |
| 本番履歴名に対応する同名ファイルがない | 29 |
| 本番履歴名に一致しないGitファイル | 38 |
| Git内でversionが重複するもの | 1 version（2ファイル） |

「117ファイルと109履歴の差が8件」という単純な差ではない。**version一致は47件にとどまり、migration名が一致してもversionが異なるものが多数ある。**

### 2.1 旧Animecia時代のファイル

`20261011...` で始まる36ファイルは、本番のmigration履歴に同名エントリーがなく、現行ANIXIAの適用履歴とも対応していない。旧Animeciaの履歴・変更案が現行migrationディレクトリに残っている可能性が高い。

これらを現行DBへ適用してはならない。旧履歴として保管するか、現行migrationディレクトリから分離するかを、Git履歴とスキーマ差分を確認して決める。**現段階では削除・移動しない。**

### 2.2 versionがずれている同名migration

migration名は一致するが、Gitファイル名のversionと本番のversionが異なるものが32件ある。例:

| Git側ファイル | 本番履歴 |
|---|---|
| `202611170001_catalog_expansion.sql` | `20261117121720 catalog_expansion` |
| `202611170002_metadata_relationships.sql` | `20261117121758 metadata_relationships` |
| `202611170003_catalog_rls_visibility.sql` | `20261117121817 catalog_rls_visibility` |
| `20261118043000_grant_admin_helper_and_short_circuit_trusted_publication.sql` | `20261118041115 grant_admin_helper_and_short_circuit_trusted_publication` |
| `20261118043000_publish_existing_qualified_wikidata_episodes.sql` | `20261118035654 publish_existing_qualified_wikidata_episodes` |

このようなファイルは「未適用」とは限らない。対応する本番履歴名が存在するため、同じ処理が別versionで適用された可能性がある。ファイル名のversionだけを根拠に再適用してはならない。

### 2.3 重複version

次の2ファイルが同じversion `20261118043000` を使用している。

- `20261118043000_grant_admin_helper_and_short_circuit_trusted_publication.sql`
- `20261118043000_publish_existing_qualified_wikidata_episodes.sql`

本番ではそれぞれ別version（`20261118041115` と `20261118035654`）の履歴名として存在する。ファイルversionを一意にする必要があるが、正しい改名先は本番履歴とGit履歴を確認して決める。

### 2.4 本番履歴に同名ファイルがない項目

本番には、Git側に同名ファイルが見当たらないmigration名が29件ある。主な例:

- `initial_anixia_database`
- `lock_quiz_scoring_to_server`
- `secure_private_quiz_answer_keys`
- `annict_work_fields_and_sync_tracking`
- `move_catalog_sync_log_to_service_only_table`
- `add_tmdb_poster_provenance`
- `bilingual_catalog_fields`
- `return_english_catalog_metadata`
- `secure_admin_user_flags_rpc`
- `prioritize_missing_posters_and_speed_up_sync`
- `relax_anime_publication_country_and_episode_requirements`
- `add_catalog_duplicate_suppressions`
- `extend_auto_publication_for_qualified_anilist_records`

これらは旧versionからの改名漏れ、Git上のファイル欠落、直接SQL適用など複数の可能性がある。migration履歴名だけからSQLを再作成してはいけない。Git commit history・schema snapshot・本番オブジェクト定義を照合する。

## 3. 本番スキーマと既存snapshotの差

既存snapshotのREADMEは、2026-11-17に取得したと明記している。本番DBを同じcatalog集計方法で確認した結果:

| オブジェクト | 既存snapshot記載 | 2026-11-26本番 |
|---|---:|---:|
| public/privateテーブル | 47 | 64 |
| 制約 | 172 | 238 |
| RLS有効テーブル | 47 | 64 |
| RLSポリシー | 69 | 123 |
| public/private関数 | 20 | 44 |
| standalone indexes | 55 | 181 |
| custom triggers | 11 | 14 |

現在の本番64テーブルはすべてRLSが有効。

### 3.1 snapshotに存在しない本番テーブル17件

- `private.anixia_catalog_quality_snapshots`
- `public.anime_broadcast_schedules`
- `public.anime_source_materials`
- `public.anime_streaming_services`
- `public.anime_theme_songs`
- `public.catalog_duplicate_suppressions`
- `public.genre_external_ids`
- `public.message_members`
- `public.message_threads`
- `public.social_post_bookmarks`
- `public.social_post_likes`
- `public.social_post_media`
- `public.social_post_reposts`
- `public.social_posts`
- `public.thread_message_media`
- `public.thread_messages`
- `public.user_follows`

### 3.2 現在のsnapshot CIの限界

既存の `.github/workflows/validate-schema-snapshot.yml` と `scripts/validate-schema-snapshot.sh` は、snapshotを一時的なローカルSupabaseへ再生し、**snapshot自身に記録された旧件数（47 tables / 172 constraints / 69 policies等）**を検証する。

これはsnapshotファイルの内部整合性を確認するテストであり、現在の本番DBとの一致を検証するものではない。CIが成功しても本番schemaとの一致は証明されない。

READMEにある通り、このsnapshotはデータ行、Authユーザー、Vault、Cron、APIキー、プラットフォーム管理情報を含まない。完全なバックアップの代替にはならない。

## 4. 適用前に止めるべきファイル

### 4.1 `20261118190000_wikipedia_synopsis_automation.sql`

本番履歴に同名migrationはない。内容にはあらすじ出典情報の追加と日本語Wikipediaソース登録（無効状態）が含まれる。

さらに、後半の `DO` ブロック内の `$needle` / `$replacement` の引用構造が崩れているように見え、SQLとして正常に解析できるか確認できない。現状のまま適用対象にしない。必要なカラム追加と詳細RPCの変更を分離し、正しい関数定義から安全なmigrationを作り直す必要がある。

### 4.2 `20261124201000_sort_latest_additions_by_registration_time.sql`

本番履歴に同名migrationはないが、現在の本番 `search_public_anime` 12引数関数は既に `a.created_at` を取得し、`newest` の並び順を `f.created_at DESC` にしている。

つまり意図された変更は本番に既に存在する。別migration経由で適用されたか、直接変更された可能性がある。現在のファイルをそのまま再適用する必要はない。重複した変更として整理対象にする。

## 5. 次の安全な作業順

### Step A — schema snapshot v2の作成
1. 本番から最新のschema-only情報を再取得する。
2. 64テーブル、238制約、181 index、123 policy、44関数、14 triggerを基準に照合する。
3. Storage・Auth連携、関数所有者、権限、default privileges、extension配置も記録する。
4. 行データ・ユーザーデータ・Vault・Cronを含めないschema snapshotと、別途必要なバックアップ手順を分離する。
5. 新しいsnapshotを隔離ローカルDBへ再生し、現在のcatalogと一致することをCIで検証する。

### Step B — migration ledgerの作成
migrationごとに次の列を持つ台帳を作る。

- Git filename / version / blob SHA
- 本番 version / name
- 同名・同version・内容一致の判定
- SQLの目的と変更オブジェクト
- 本番オブジェクトへの反映確認
- 旧版・重複・pending・欠落・直接SQLの分類
- 次の処置（保持、改名、アーカイブ、再構築、適用不要）

### Step C — migration chainの整理
- 旧Animecia 36件は隔離方針を決める。
- 32件のversionずれは本番適用履歴と内容を対応付ける。
- 重複versionを解消する。
- 本番履歴に対応ファイルがない29件はGit履歴等から復元可能性を調査する。
- 既に本番に反映済みの処理を再適用しない。
- 新規DB再構築テストが通るまで、本番migration履歴をrepairしない。

### Step D — 本番変更の再開条件
次のすべてを満たすまで、大規模DDL・migration repair・データ移行を実行しない。

- 現行本番schema snapshot v2が取得済み
- 隔離環境でsnapshot replayが成功
- migration ledgerで全件が分類済み
- 変更対象のSQLが冪等性・ロールバック・データ影響をレビュー済み
- 復旧手順が確認済み

## 6. 今回実施したこと

- Git migrationファイル117件と本番履歴109件を照合。
- migration名一致79件、version完全一致47件を確認。
- version重複1件（2ファイル）を特定。
- 本番schema catalogと既存snapshotの差を確認。
- snapshotにない本番テーブル17件を特定。
- 適用前に再確認が必要な2ファイルを特定。
- 本番DB・migration履歴・Cron・Edge Functionsへの変更は行っていない。

**次の実装作業はschema snapshot v2とmigration ledgerの整備。** 本番DBへの変更は、この2つの照合が完了してから行う。

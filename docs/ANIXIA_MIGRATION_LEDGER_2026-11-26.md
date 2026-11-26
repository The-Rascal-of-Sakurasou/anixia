# ANIXIA migration ledger — 2026-11-26

この台帳はGitファイル名・blob SHAとSupabaseの `schema_migrations` 履歴の照合結果。**migration名やversionが一致しても、SQL内容が本番適用内容と同一であることを証明するものではない。** 本番適用・repair・ファイル削除・改名の判断には、SQL本文、Git履歴、現在のDBオブジェクト定義の追加照合が必要。

## Summary

- Git SQL files: 117
- Production migration rows: 109
- Exact version matches: 47
- Files whose migration name exists in production history: 79
- Files with no same-name production history: 38
- Production migration rows with no same-name Git file: 29
- Duplicate Git version: `20261118043000` (2 files)
- Duplicate production migration name: `catalog_expansion` (2 versions)

## Git files

| File | Note | Production mapping | Blob SHA |
|---|---|---|---|
| `20261011143000_align_animecia_catalog_policy_v3.sql` |  | 旧Animecia候補・本番同名履歴なし | `853c370c1182c7a3de35165af9560fe48dcc5627` |
| `20261011150000_catalog_policy_promotional_exclusions.sql` |  | 旧Animecia候補・本番同名履歴なし | `3cc11ca442425f54898416180db64480812e0859` |
| `20261011151500_expose_policy_fields_and_exclude_promos.sql` |  | 旧Animecia候補・本番同名履歴なし | `5f5f0b2fa1ec4476137c5d844cf9dcde7ae08c8b` |
| `20261011170000_align_catalog_filter_options_with_public_policy.sql` |  | 旧Animecia候補・本番同名履歴なし | `84e0288e3c09de6871983988367c308b3c4852d5` |
| `20261011173000_remove_unrequested_sensitive_visual_catalog_exclusion.sql` |  | 旧Animecia候補・本番同名履歴なし | `c090291031f87687d8f7032e57c9754859b6dd6c` |
| `20261011174500_align_anime_select_rls_with_catalog_policy_v4.sql` |  | 旧Animecia候補・本番同名履歴なし | `d2dd36b5789f1247c92ba6f8960d91fc7b671d04` |
| `20261011180000_remove_duplicate_anime_source_identity_index.sql` |  | 旧Animecia候補・本番同名履歴なし | `52ab114f4e943ff1209310908a5d71fafd4c39a2` |
| `20261011181000_secure_public_anime_view_with_invoker_rls.sql` |  | 旧Animecia候補・本番同名履歴なし | `8ebfbfc90d9fcd2172f7fe31e1d4b75e36ba6c34` |
| `20261011183000_make_anime_comparison_catalog_security_invoker.sql` |  | 旧Animecia候補・本番同名履歴なし | `512c1089282283593c1fcc05993f692a7fcf5b10` |
| `20261011184500_restrict_catalog_maintenance_rpc_execution.sql` |  | 旧Animecia候補・本番同名履歴なし | `5cb7a15778c74fb0c51ddfc963b50ba12baf3cc4` |
| `20261011185500_enforce_public_catalog_security_invoker.sql` |  | 旧Animecia候補・本番同名履歴なし | `6f67f3bf9ccc68fafe5adb41fcd88234350db5a8` |
| `20261011190000_search_anime_catalog_v3_server_side_filters.sql` |  | 旧Animecia候補・本番同名履歴なし | `1fd493036ec7726b010620380598982098662365` |
| `20261011191000_align_engagement_summary_with_public_catalog.sql` |  | 旧Animecia候補・本番同名履歴なし | `931d5b5c68cda9a40371491ce460e6d7a9fdfd40` |
| `20261011192000_secure_comparison_stats_rpc.sql` |  | 旧Animecia候補・本番同名履歴なし | `ebac942f7ff7ebc8d285b2fba835229c9e43881e` |
| `20261011193000_reconcile_catalog_policy_status_and_future_updates.sql` |  | 旧Animecia候補・本番同名履歴なし | `813e3d36910c2f6aacfb75dc9802e9ce2ba8a5e7` |
| `20261011193500_restore_catalog_records_blocked_only_by_sensitive_visual_flag.sql` |  | 旧Animecia候補・本番同名履歴なし | `a48c4b3fc3cc2a6f4b111b8c8aadfbadb50b5963` |
| `20261011194000_remove_sensitive_visual_catalog_exclusion.sql` |  | 旧Animecia候補・本番同名履歴なし | `65f21be00c972e9d207c8f7a14c0e7e13993b565` |
| `20261011194500_resolve_same_season_anime_import_duplicates_20261011.sql` |  | 旧Animecia候補・本番同名履歴なし | `6b178c295efad70750bd49b9dad7ef3e4af18783` |
| `20261011195000_make_public_catalog_search_rpcs_invoker.sql` |  | 旧Animecia候補・本番同名履歴なし | `97ec5e1242969799cd6b02f735fcac9b637c8836` |
| `20261011200000_grant_service_role_public_catalog_views.sql` |  | 旧Animecia候補・本番同名履歴なし | `4a77987be822f01e800b70eb43481d9a8736e100` |
| `20261011200500_exclude_japanese_promotional_trailer_titles.sql` |  | 旧Animecia候補・本番同名履歴なし | `0dad388aa011cd20d2c350adace382c1ec4f0c42` |
| `20261011201000_finalize_explicit_sensitive_content_policy.sql` |  | 旧Animecia候補・本番同名履歴なし | `65a72500a5f8c9d38af44ab65be45e09f2b8e097` |
| `20261011201500_restore_all_existing_catalog_genres.sql` |  | 旧Animecia候補・本番同名履歴なし | `eae2f3b729015107ca9fbbe09ec9d496fcfbbfc8` |
| `20261011202000_expand_catalog_search_title_fields.sql` |  | 旧Animecia候補・本番同名履歴なし | `da8f2aeee7d00ead4f5a876679a3f50ed5402eea` |
| `20261011203000_fix_romaji_to_hiragana_and_title_kana.sql` |  | 旧Animecia候補・本番同名履歴なし | `fb911efea943cecaae84c326d977da8089535e28` |
| `20261011204000_normalize_title_sort_keys.sql` |  | 旧Animecia候補・本番同名履歴なし | `4d6f9c1683c8b94960787ebfee410482aff4b3b4` |
| `20261011204500_normalize_gojuon_keys.sql` |  | 旧Animecia候補・本番同名履歴なし | `26ef8267191005cbf17952292cac2ab94fe57b4f` |
| `20261011205000_make_profile_follow_stats_invoker.sql` |  | 旧Animecia候補・本番同名履歴なし | `6d5de7306b52fe539531f5c9b3e573fcb9662d6c` |
| `20261011205500_recalculate_stale_sensitive_catalog_reasons.sql` |  | 旧Animecia候補・本番同名履歴なし | `589403697bcc3af2201684ebc124a366cd56d4f6` |
| `20261011211000_harden_function_search_paths.sql` |  | 旧Animecia候補・本番同名履歴なし | `3a7d8937ec403146c4a1e5bc77d74bb009835c90` |
| `20261011212000_english_title_reading_exceptions.sql` |  | 旧Animecia候補・本番同名履歴なし | `3e0b9004bcd901e17c795a5e3e2d6a7186ea7b01` |
| `20261011213000_harden_message_thread_membership_probe.sql` |  | 旧Animecia候補・本番同名履歴なし | `c4eb7d61e6a28a8ddef3f618469ce55197e01370` |
| `20261011214000_dedupe_and_harden_advertisement_policies.sql` |  | 旧Animecia候補・本番同名履歴なし | `577b60cd00850d9a8b3f6518585d7bdc678d75e6` |
| `20261011215000_harden_legacy_visitor_comment_policies.sql` |  | 旧Animecia候補・本番同名履歴なし | `8b54c4510b8de3ffd94aa88cdcb0a0ff1904ebff` |
| `20261011220000_optimize_auth_rls_policy_evaluation.sql` |  | 旧Animecia候補・本番同名履歴なし | `9311bb77ec9e978c192c798d9181742dc6b14289` |
| `20261011221000_optimize_visitor_header_policy_evaluation.sql` |  | 旧Animecia候補・本番同名履歴なし | `f168963fe72101e55ee9d9eb7eb1807dd361291c` |
| `202611170001_catalog_expansion.sql` |  | 同名履歴あり・version不一致（20261117121720, 20261117121754） | `9fbb982533ccfb2501b9733c0af1c10f0df59d02` |
| `202611170002_metadata_relationships.sql` |  | 同名履歴あり・version不一致（20261117121758） | `5fb47c9b614cc469eb4da64b13433fa3335a1766` |
| `202611170003_catalog_rls_visibility.sql` |  | 同名履歴あり・version不一致（20261117121817） | `2c06b0c0c22d8dc660ab8cb8337bf9d222969df5` |
| `202611170004_restrict_internal_catalog_privileges.sql` |  | 同名履歴あり・version不一致（20261117121821） | `956ecedb77be47031a798a29a28967e34260d4d4` |
| `202611170005_provider_identity_columns.sql` |  | 同名履歴あり・version不一致（20261117121824） | `34e9b3d91371fbd268fa0270af3967760847ed0d` |
| `202611170006_upsert_conflict_indexes.sql` |  | 同名履歴あり・version不一致（20261117121827） | `f230e3c7195c9a7532ff5c44e0a1c8cca59dadef` |
| `202611170007_catalog_taxonomy_admin.sql` |  | 同名履歴あり・version不一致（20261117122447） | `c2cd1666894478ddb4432db2d21d86af6d731e0c` |
| `202611170008_public_anime_detail_expansion.sql` |  | 同名履歴あり・version不一致（20261117122629） | `21157c26a982fa81ffd006449d55cffd28f9fd35` |
| `202611170009_harden_taxonomy_rpc.sql` |  | 同名履歴あり・version不一致（20261117122725） | `12708fb9ce4b22354a880a545d962ac7a3b86813` |
| `202611170010_revoke_anon_catalog_writes.sql` |  | 同名履歴あり・version不一致（20261117122832） | `c84d6072b928229dcbb433c229bb258cf75cb6a0` |
| `20261117113124_secure_quiz_attempt_submission.sql` |  | version一致（secure_quiz_attempt_submission） | `74a77dfc97ca4cfb7a5181c9317b83fa23fcbb60` |
| `20261117113331_public_anime_rating_summary.sql` |  | version一致（public_anime_rating_summary） | `972b78c51e55a7fef2bb242e39e2b206fddc878b` |
| `20261117113738_anixia_admin_access.sql` |  | version一致（anixia_admin_access） | `dc4c246ad5c8eb57e7709f52a12445963d3805f8` |
| `20261117113926_server_side_public_anime_queries.sql` |  | version一致（server_side_public_anime_queries） | `6341c6df41ad9a608447eae9352495a2c7810310` |
| `20261117114107_tighten_public_helper_function_exposure.sql` |  | version一致（tighten_public_helper_function_exposure） | `7ad542c84e47606aa75fefcc6ac411a8635b5c43` |
| `20261117114737_review_drafts_and_admin_moderation.sql` |  | version一致（review_drafts_and_admin_moderation） | `f18eaa6b33572f425a214d520d07214847884d2e` |
| `20261117114849_admin_review_queue_access.sql` |  | version一致（admin_review_queue_access） | `310c20a5899cc5e5a4add6d35ff88d4e2cb6d792` |
| `20261117114956_fix_quiz_answer_json_iteration.sql` |  | version一致（fix_quiz_answer_json_iteration） | `1329ba978f9c6465ec7fe32a05d226c5a103322a` |
| `20261117115456_admin_catalog_candidate_review.sql` |  | version一致（admin_catalog_candidate_review） | `474852de6c43e053d8ef941c326156c08f8cf5b6` |
| `20261117120453_seed_initial_genre_taxonomy.sql` |  | version一致（seed_initial_genre_taxonomy） | `c7b39ea24356129af88b6be56266fea0e376569d` |
| `20261117123832_advanced_catalog_search.sql` |  | version一致（advanced_catalog_search） | `b1204ea2d7ed8b5a8004538ba7d3963a87c556ae` |
| `20261117124406_fix_catalog_public_read_policies.sql` |  | version一致（fix_catalog_public_read_policies） | `cdd7227d63818b0407f8eecb28b617713bbc8cc4` |
| `20261117125844_admin_catalog_quality_report.sql` |  | version一致（admin_catalog_quality_report） | `bd9f416204ca2f48f37bf0e7e94331e9af21880d` |
| `20261117130351_catalog_entity_deduplication_tools.sql` |  | version一致（catalog_entity_deduplication_tools） | `5378254dd1be91c694992777321abb8dc683cc40` |
| `20261117131434_alias_aware_catalog_search.sql` |  | version一致（alias_aware_catalog_search） | `daa712f8b3d3adf7612de3d8153fdf5fabc8cdd6` |
| `20261117131719_legacy_catalog_search_wrapper.sql` |  | version一致（legacy_catalog_search_wrapper） | `50623a9b7985644794040f89bcc33062de6c4a12` |
| `20261117132200_catalog_search_suggestions.sql` |  | version一致（catalog_search_suggestions） | `f66e820c45f7be2061d3a5cbef319ae2d7b1d09a` |
| `20261117132444_guard_catalog_suggestion_query_length.sql` |  | version一致（guard_catalog_suggestion_query_length） | `4b0ca5f4fc1c6154f0d4660b67dfc651306a17dc` |
| `20261117134547_include_voice_actors_in_public_anime_detail.sql` |  | version一致（include_voice_actors_in_public_anime_detail） | `19170d77b3ee98e6121e49a1cabd9005b487773d` |
| `20261117135208_wikidata_catalog_auto_sync.sql` |  | version一致（wikidata_catalog_auto_sync） | `25ec79f45bf228b531b4f4a7f5071917be9b500b` |
| `20261117142131_review_and_publish_verified_wikidata_candidates.sql` |  | version一致（review_and_publish_verified_wikidata_candidates） | `f91ff9461cb50be54bedad3eb5c71c6cef55f6ac` |
| `20261118032911_complete_missing_published_title_kana.sql` |  | version一致（complete_missing_published_title_kana） | `5f1fc375eb2a42eb165696b43e9c9c79917eb48d` |
| `20261118032956_deduplicate_published_anime_title_aliases.sql` |  | version一致（deduplicate_published_anime_title_aliases） | `e438f3daac4b0192a539da2f6e4223e770035a5f` |
| `20261118033509_anime_external_id_backfill_and_duplicate_review.sql` |  | version一致（anime_external_id_backfill_and_duplicate_review） | `e8ccedf9f2a53cd1bf42353e7d34baa8f0ad496b` |
| `20261118033823_wikidata_catalog_enrichment_automation.sql` |  | version一致（wikidata_catalog_enrichment_automation） | `6accd63ac13a61f8402c1257b031d5feb8dfb805` |
| `20261118034241_schedule_wikidata_episode_sync.sql` |  | version一致（schedule_wikidata_episode_sync） | `4d80a587ba01708aa2aefc4b07a094691d936fda` |
| `20261118034405_schedule_commons_poster_sync.sql` |  | version一致（schedule_commons_poster_sync） | `1fdbec11b55b72af8bfd588060da6bdb7179cbd1` |
| `20261118034634_auto_publish_qualified_wikidata_catalog_records.sql` |  | version一致（auto_publish_qualified_wikidata_catalog_records） | `f523f925f3c91305af1f5d715bfeb9cfb01fcedc` |
| `20261118034821_include_web_anime_in_auto_publication.sql` |  | version一致（include_web_anime_in_auto_publication） | `3408b7b9938a295c3103be2f179bb18ee14ae18f` |
| `20261118034935_register_wikimedia_commons_source.sql` |  | version一致（register_wikimedia_commons_source） | `1b8e544d5a7df1d7a5eeb3bcb676649ab0164682` |
| `20261118035100_restore_daily_wikidata_catalog_sync_schedule.sql` |  | 同名履歴あり・version不一致（20261118035308） | `83d3cf8501dea5ece2dca42850e4707f0281f60d` |
| `20261118035115_restore_review_gate_for_wikidata_catalog.sql` |  | version一致（restore_review_gate_for_wikidata_catalog） | `9621baf7f8d09ecf184f29e4e7574d01b43413e9` |
| `20261118035209_schedule_wikidata_catalog_sync_daily.sql` |  | version一致（schedule_wikidata_catalog_sync_daily） | `dbc0ac7d6cc13dbad927b0502ff6ef912a6521ec` |
| `20261118035226_re_enable_review_gated_wikidata_ingestion.sql` |  | version一致（re_enable_review_gated_wikidata_ingestion） | `dbc0ac7d6cc13dbad927b0502ff6ef912a6521ec` |
| `20261118035500_publish_existing_qualified_wikidata_records.sql` |  | 同名履歴あり・version不一致（20261118035419） | `e14462ec746f4dfc94fa40073321ef400cea5de9` |
| `20261118040000_restore_catalog_and_seasonal_sync_schedules.sql` |  | 同名履歴あり・version不一致（20261118035806） | `e3210272e6c78c0b83785a37e2b5e1e03e328d5c` |
| `20261118040603_disable_wikipedia_prose_and_limit_commons_to_public_domain.sql` |  | version一致（disable_wikipedia_prose_and_limit_commons_to_public_domain） | `b732893613d71363471be5361bb1abd688276078` |
| `20261118040733_schedule_rights_compliant_catalog_automation.sql` |  | version一致（schedule_rights_compliant_catalog_automation） | `2388e9a476eb2ed68116459bcff1574e56399f76` |
| `20261118041000_allow_qualified_wikidata_auto_publication_and_resume_catalog.sql` |  | 同名履歴あり・version不一致（20261118040048） | `645e0b6a5614d3f6a3b802550c1883ec4eef7d28` |
| `20261118041200_harden_qualified_wikidata_auto_publication_guard.sql` |  | 同名履歴あり・version不一致（20261118040108） | `289fc3362bd6a528eecfbdb05e20a267587e15d8` |
| `20261118041500_allow_backend_service_role_catalog_publication.sql` |  | 同名履歴あり・version不一致（20261118040320） | `705e2b2e0ff564b5c91e6ce288872809ac7bf4ff` |
| `20261118042000_auto_publish_ona_and_qualified_wikidata_episodes.sql` |  | 同名履歴あり・version不一致（20261118040808） | `31743456711d31a403856afad6e809c3234f5315` |
| `20261118042500_increase_episode_sync_to_daily_batches.sql` |  | 同名履歴あり・version不一致（20261118040907） | `8ee45e6bd5af21bd933798aeab0f79f2cc802e56` |
| `20261118043000_grant_admin_helper_and_short_circuit_trusted_publication.sql` | **重複version** | 同名履歴あり・version不一致（20261118041115） | `92b54d049873ca0865fdf69ad1b85e9792c63e60` |
| `20261118043000_publish_existing_qualified_wikidata_episodes.sql` | **重複version** | 同名履歴あり・version不一致（20261118035654） | `8c082578c99db7f13c92b850c9fbfa6d78f16ccb` |
| `20261118043500_include_standalone_special_in_automatic_publication.sql` |  | 同名履歴あり・version不一致（20261118041151） | `8c8df951172791593d60dba4a73b6d626d23b0d5` |
| `20261118044000_daily_enrichment_batch_20_and_fix_counts.sql` |  | 同名履歴あり・version不一致（20261118063221） | `3a6e6a915746e5d7c2982a411da47b3d6d26806b` |
| `20261118130000_anime_duplicate_review_mal_id_match.sql` |  | 同名履歴あり・version不一致（20261118034611） | `42f8f1178bdc2fd69f2b067f2a390f2a13050248` |
| `20261118153000_enable_automated_wikidata_catalog_sync.sql` |  | 同名履歴あり・version不一致（20261118035318） | `781853e6157b7ba8c1a1201e5bd385201dc8efda` |
| `20261118161000_resume_review_gated_wikidata_catalog_sync.sql` |  | 同名履歴あり・version不一致（20261118035918） | `a7afec72561dcc7890dfa187e39f863f5163061b` |
| `20261118190000_wikipedia_synopsis_automation.sql` |  | 未適用候補・SQL構文要確認 | `10cd2cc326767f18986f2a021947c1c05d1b7867` |
| `20261119090000_allow_attributed_commons_posters.sql` |  | 同名履歴あり・version不一致（20261119082650） | `fe957d8de1b2ac664b8c0a912bb8f78e556bd0bc` |
| `20261119102022_social_profiles_and_private_messaging.sql` |  | version一致（social_profiles_and_private_messaging） | `154dd4986f1369a799f985a37ad040eb80268bca` |
| `20261119102215_public_profile_visibility_policies.sql` |  | version一致（public_profile_visibility_policies） | `06d2f5221dda560bfff70fc63da40cb9e6b4bec1` |
| `20261119102849_harden_social_table_privileges.sql` |  | version一致（harden_social_table_privileges） | `ea5306e7afdbe935425295ebf14f1238b54ae817` |
| `20261119102930_restrict_social_rpc_execution.sql` |  | version一致（restrict_social_rpc_execution） | `e1abe643719d3a36c8a35a088f631ace7eab86ff` |
| `20261119103225_maintain_message_thread_activity.sql` |  | version一致（maintain_message_thread_activity） | `a38b75b838a0caf274c6b21d417a01634dca990c` |
| `20261119103640_fix_social_post_reply_policy.sql` |  | version一致（fix_social_post_reply_policy） | `059e49a48866209917ca130585c18f1f665ab218` |
| `20261119103728_separate_watchlist_profile_visibility.sql` |  | version一致（separate_watchlist_profile_visibility） | `2419d77ef2131f047751363e57bcaf06a46cadd7` |
| `20261119193000_expand_anixia_catalog_quality_snapshots.sql` |  | 同名履歴あり・version不一致（20261119105855） | `df8fc07250b613b7d1f4e98396031dc625b4753a` |
| `20261124104952_respect_profile_privacy_in_public_anime_rpcs.sql` |  | version一致（respect_profile_privacy_in_public_anime_rpcs） | `af8f16acae07ca299963a9cc0bb146385812741d` |
| `20261124110500_remove_duplicate_anime_source_unique_index.sql` |  | 同名履歴あり・version不一致（20261124105226） | `d0c9676eb4ac54f7c909a26349b77fd840f00a1b` |
| `20261124201000_sort_latest_additions_by_registration_time.sql` |  | 未適用候補・同等の挙動が本番関数に存在 | `3746abc67d2ddb4ad3db69953a6c2998f7b1abbf` |
| `20261124210000_add_anime_broadcast_streaming_themes_sources.sql` |  | 同名履歴あり・version不一致（20261124112744） | `daa8a174de906ae68c191cb7cea8490a92c948e1` |
| `20261124211500_optimize_anime_metadata_rls.sql` |  | 同名履歴あり・version不一致（20261124112838） | `19a54ea887c9971f65baebe99cd743dd592e1483` |
| `20261124213000_resume_incremental_wikidata_episode_sync.sql` |  | 同名履歴あり・version不一致（20261124113050） | `b2bd3d1e46e37328d720f88e0342e220f5301e31` |
| `20261124213500_set_wikidata_episode_sync_batch.sql` |  | 同名履歴あり・version不一致（20261124113345） | `c6d0ea040e39a8b15546613cf08231ff6250d8a0` |
| `20261125115719_add_fast_public_catalog_homepage_queries.sql` |  | version一致（add_fast_public_catalog_homepage_queries） | `ad35d92a01e5b4c30ed10e4e977137c03d78ddc9` |
| `20261125120436_accelerate_public_catalog_substring_search.sql` |  | version一致（accelerate_public_catalog_substring_search） | `637e85d70d218777dfaf9e7293427af6451e7674` |
| `20261125120656_revert_regressive_trigram_search_experiment.sql` |  | version一致（revert_regressive_trigram_search_experiment） | `55ae51373e6d16239adc83288de5a9c9ff0d92f9` |
| `20261125121113_optimize_public_catalog_search_candidate_sets.sql` |  | version一致（optimize_public_catalog_search_candidate_sets） | `f24d856af33ee0b1862a9e566873ff10665b0bf9` |

## Production history

| Applied version | Migration name | Git mapping |
|---|---|---|
| 20261117105207 | `initial_anixia_database` | 同名ファイルなし |
| 20261117105225 | `lock_quiz_scoring_to_server` | 同名ファイルなし |
| 20261117105352 | `secure_private_quiz_answer_keys` | 同名ファイルなし |
| 20261117105543 | `annict_work_fields_and_sync_tracking` | 同名ファイルなし |
| 20261117105617 | `move_catalog_sync_log_to_service_only_table` | 同名ファイルなし |
| 20261117113124 | `secure_quiz_attempt_submission` | version一致 |
| 20261117113331 | `public_anime_rating_summary` | version一致 |
| 20261117113738 | `anixia_admin_access` | version一致 |
| 20261117113926 | `server_side_public_anime_queries` | version一致 |
| 20261117114107 | `tighten_public_helper_function_exposure` | version一致 |
| 20261117114737 | `review_drafts_and_admin_moderation` | version一致 |
| 20261117114849 | `admin_review_queue_access` | version一致 |
| 20261117114956 | `fix_quiz_answer_json_iteration` | version一致 |
| 20261117115456 | `admin_catalog_candidate_review` | version一致 |
| 20261117120453 | `seed_initial_genre_taxonomy` | version一致 |
| 20261117121720 | `catalog_expansion` | 同名ファイルあり・version差（202611170001） |
| 20261117121754 | `catalog_expansion` | 同名ファイルあり・version差（202611170001） |
| 20261117121758 | `metadata_relationships` | 同名ファイルあり・version差（202611170002） |
| 20261117121817 | `catalog_rls_visibility` | 同名ファイルあり・version差（202611170003） |
| 20261117121821 | `restrict_internal_catalog_privileges` | 同名ファイルあり・version差（202611170004） |
| 20261117121824 | `provider_identity_columns` | 同名ファイルあり・version差（202611170005） |
| 20261117121827 | `upsert_conflict_indexes` | 同名ファイルあり・version差（202611170006） |
| 20261117122447 | `catalog_taxonomy_admin` | 同名ファイルあり・version差（202611170007） |
| 20261117122629 | `public_anime_detail_expansion` | 同名ファイルあり・version差（202611170008） |
| 20261117122725 | `harden_taxonomy_rpc` | 同名ファイルあり・version差（202611170009） |
| 20261117122832 | `revoke_anon_catalog_writes` | 同名ファイルあり・version差（202611170010） |
| 20261117123832 | `advanced_catalog_search` | version一致 |
| 20261117124406 | `fix_catalog_public_read_policies` | version一致 |
| 20261117125844 | `admin_catalog_quality_report` | version一致 |
| 20261117130351 | `catalog_entity_deduplication_tools` | version一致 |
| 20261117131434 | `alias_aware_catalog_search` | version一致 |
| 20261117131719 | `legacy_catalog_search_wrapper` | version一致 |
| 20261117132200 | `catalog_search_suggestions` | version一致 |
| 20261117132444 | `guard_catalog_suggestion_query_length` | version一致 |
| 20261117134449 | `add_tmdb_poster_provenance` | 同名ファイルなし |
| 20261117134547 | `include_voice_actors_in_public_anime_detail` | version一致 |
| 20261117135208 | `wikidata_catalog_auto_sync` | version一致 |
| 20261117142131 | `review_and_publish_verified_wikidata_candidates` | version一致 |
| 20261118032911 | `complete_missing_published_title_kana` | version一致 |
| 20261118032956 | `deduplicate_published_anime_title_aliases` | version一致 |
| 20261118033509 | `anime_external_id_backfill_and_duplicate_review` | version一致 |
| 20261118033823 | `wikidata_catalog_enrichment_automation` | version一致 |
| 20261118034241 | `schedule_wikidata_episode_sync` | version一致 |
| 20261118034405 | `schedule_commons_poster_sync` | version一致 |
| 20261118034611 | `anime_duplicate_review_mal_id_match` | 同名ファイルあり・version差（20261118130000） |
| 20261118034634 | `auto_publish_qualified_wikidata_catalog_records` | version一致 |
| 20261118034821 | `include_web_anime_in_auto_publication` | version一致 |
| 20261118034935 | `register_wikimedia_commons_source` | version一致 |
| 20261118035115 | `restore_review_gate_for_wikidata_catalog` | version一致 |
| 20261118035209 | `schedule_wikidata_catalog_sync_daily` | version一致 |
| 20261118035226 | `re_enable_review_gated_wikidata_ingestion` | version一致 |
| 20261118035308 | `restore_daily_wikidata_catalog_sync_schedule` | 同名ファイルあり・version差（20261118035100） |
| 20261118035318 | `enable_automated_wikidata_catalog_sync` | 同名ファイルあり・version差（20261118153000） |
| 20261118035353 | `stabilize_anixia_metadata_sync_batches` | 同名ファイルなし |
| 20261118035419 | `publish_existing_qualified_wikidata_records` | 同名ファイルあり・version差（20261118035500） |
| 20261118035642 | `pause_catalog_sync_until_review_gate_fixed` | 同名ファイルなし |
| 20261118035654 | `publish_existing_qualified_wikidata_episodes` | 同名ファイルあり・version差（20261118043000） |
| 20261118035806 | `restore_catalog_and_seasonal_sync_schedules` | 同名ファイルあり・version差（20261118040000） |
| 20261118035811 | `enforce_manual_publication_for_anime_and_episodes` | 同名ファイルなし |
| 20261118035824 | `restore_anixia_catalog_metadata_cron_jobs` | 同名ファイルなし |
| 20261118035918 | `resume_review_gated_wikidata_catalog_sync` | 同名ファイルあり・version差（20261118161000） |
| 20261118040048 | `allow_qualified_wikidata_auto_publication_and_resume_catalog` | 同名ファイルあり・version差（20261118041000） |
| 20261118040108 | `harden_qualified_wikidata_auto_publication_guard` | 同名ファイルあり・version差（20261118041200） |
| 20261118040250 | `require_admin_for_all_catalog_publication` | 同名ファイルなし |
| 20261118040320 | `allow_backend_service_role_catalog_publication` | 同名ファイルあり・version差（20261118041500） |
| 20261118040603 | `disable_wikipedia_prose_and_limit_commons_to_public_domain` | version一致 |
| 20261118040733 | `schedule_rights_compliant_catalog_automation` | version一致 |
| 20261118040808 | `auto_publish_ona_and_qualified_wikidata_episodes` | 同名ファイルあり・version差（20261118042000） |
| 20261118040907 | `increase_episode_sync_to_daily_batches` | 同名ファイルあり・version差（20261118042500） |
| 20261118041115 | `grant_admin_helper_and_short_circuit_trusted_publication` | 同名ファイルあり・version差（20261118043000） |
| 20261118041151 | `include_standalone_special_in_automatic_publication` | 同名ファイルあり・version差（20261118043500） |
| 20261118041311 | `public_poster_credit_lookup` | 同名ファイルなし |
| 20261118063221 | `daily_enrichment_batch_20_and_fix_counts` | 同名ファイルあり・version差（20261118044000） |
| 20261118063436 | `catalog_quality_snapshots_monitor` | 同名ファイルなし |
| 20261118063538 | `admin_catalog_quality_history_rpc` | 同名ファイルなし |
| 20261118063749 | `poster_attempt_tracking_and_retry_cooldown` | 同名ファイルなし |
| 20261119082650 | `allow_attributed_commons_posters` | 同名ファイルあり・version差（20261119090000） |
| 20261119101147 | `bilingual_catalog_fields` | 同名ファイルなし |
| 20261119101207 | `return_english_catalog_metadata` | 同名ファイルなし |
| 20261119102022 | `social_profiles_and_private_messaging` | version一致 |
| 20261119102215 | `public_profile_visibility_policies` | version一致 |
| 20261119102843 | `add_wikidata_short_descriptions` | 同名ファイルなし |
| 20261119102849 | `harden_social_table_privileges` | version一致 |
| 20261119102930 | `restrict_social_rpc_execution` | version一致 |
| 20261119103225 | `maintain_message_thread_activity` | version一致 |
| 20261119103640 | `fix_social_post_reply_policy` | version一致 |
| 20261119103728 | `separate_watchlist_profile_visibility` | version一致 |
| 20261119105855 | `expand_anixia_catalog_quality_snapshots` | 同名ファイルあり・version差（20261119193000） |
| 20261119110250 | `pause_anilist_season_metadata_cron` | 同名ファイルなし |
| 20261119110355 | `increase_daily_wikidata_enrichment_batch` | 同名ファイルなし |
| 20261119121059 | `dedupe_catalog_autocomplete_suggestions_by_name` | 同名ファイルなし |
| 20261121062005 | `deduplicate_canonical_genres` | 同名ファイルなし |
| 20261121062222 | `merge_semantic_genre_duplicates` | 同名ファイルなし |
| 20261121062719 | `clean_anixia_genre_taxonomy` | 同名ファイルなし |
| 20261122123107 | `secure_admin_user_flags_rpc` | 同名ファイルなし |
| 20261124104952 | `respect_profile_privacy_in_public_anime_rpcs` | version一致 |
| 20261124105114 | `prioritize_missing_posters_and_speed_up_sync` | 同名ファイルなし |
| 20261124105226 | `remove_duplicate_anime_source_unique_index` | 同名ファイルあり・version差（20261124110500） |
| 20261124112702 | `relax_anime_publication_country_and_episode_requirements` | 同名ファイルなし |
| 20261124112744 | `add_anime_broadcast_streaming_themes_sources` | 同名ファイルあり・version差（20261124210000） |
| 20261124112838 | `optimize_anime_metadata_rls` | 同名ファイルあり・version差（20261124211500） |
| 20261124113050 | `resume_incremental_wikidata_episode_sync` | 同名ファイルあり・version差（20261124213000） |
| 20261124113345 | `set_wikidata_episode_sync_batch` | 同名ファイルあり・version差（20261124213500） |
| 20261124114955 | `add_catalog_duplicate_suppressions` | 同名ファイルなし |
| 20261124131844 | `extend_auto_publication_for_qualified_anilist_records` | 同名ファイルなし |
| 20261125115719 | `add_fast_public_catalog_homepage_queries` | version一致 |
| 20261125120436 | `accelerate_public_catalog_substring_search` | version一致 |
| 20261125120656 | `revert_regressive_trigram_search_experiment` | version一致 |
| 20261125121113 | `optimize_public_catalog_search_candidate_sets` | version一致 |

## Required handling

1. Do not run all files in this directory as pending migrations.
2. Keep the 36 `202610...` Animecia-era files out of any production apply workflow until their historical role is proven.
3. Resolve the two `20261118043000` files by mapping them to their actual applied version history; do not choose a new version based on filename alone.
4. Review the malformed-looking `wikipedia_synopsis_automation` file before any use. Its dollar-quote delimiters in the DO block appear inconsistent.
5. The `sort_latest_additions_by_registration_time` migration has no same-name production history, but the live `search_public_anime` function already orders `newest` by `created_at`. Treat it as a duplicate-effect candidate, not as a pending migration to run.
6. For every name-matched but version-mismatched file, compare the exact SQL with the applied commit/version before deciding whether a rename or archive is appropriate.
7. Restore missing migration files from Git history only when the original SQL can be recovered and matched to the production change. Never reconstruct DDL from a migration name alone.
8. Generate a fresh schema-only snapshot from production and verify it in a disposable local database before attempting migration-chain cleanup.

## Safety boundary

This ledger is observational only. No production migrations were applied, no migration history was repaired, and no Git migration files were changed during this reconciliation.

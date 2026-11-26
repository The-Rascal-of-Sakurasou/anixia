-- ANIXIA live catalog inventory (read-only)
-- Run against the intended project using a read-only-capable database session.
-- This is an inventory report, NOT a pg_dump replacement or restore script.

-- 1. Environment and object counts.
SELECT
  current_database() AS database_name,
  current_setting('server_version') AS postgres_version,
  now() AS captured_at,
  (SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
   WHERE n.nspname IN ('public','private') AND c.relkind IN ('r','p')) AS tables,
  (SELECT count(*) FROM pg_constraint c JOIN pg_namespace n ON n.oid=c.connamespace
   WHERE n.nspname IN ('public','private')) AS constraints,
  (SELECT count(*) FROM pg_index i JOIN pg_class c ON c.oid=i.indexrelid
   JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname IN ('public','private')) AS indexes,
  (SELECT count(*) FROM pg_policies WHERE schemaname IN ('public','private')) AS policies,
  (SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname IN ('public','private') AND p.prokind='f') AS functions,
  (SELECT count(*) FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid
   JOIN pg_namespace n ON n.oid=c.relnamespace
   WHERE n.nspname IN ('public','private','auth') AND NOT t.tgisinternal) AS non_internal_triggers;

-- 2. Tables and columns, including type, default, nullability and comments.
SELECT
  n.nspname AS schema_name,
  c.relname AS table_name,
  c.relrowsecurity AS rls_enabled,
  c.relforcerowsecurity AS force_rls,
  a.attnum AS ordinal_position,
  a.attname AS column_name,
  format_type(a.atttypid,a.atttypmod) AS data_type,
  NOT a.attnotnull AS is_nullable,
  pg_get_expr(d.adbin,d.adrelid) AS column_default,
  col_description(c.oid,a.attnum) AS column_comment
FROM pg_class c
JOIN pg_namespace n ON n.oid=c.relnamespace
JOIN pg_attribute a ON a.attrelid=c.oid AND a.attnum>0 AND NOT a.attisdropped
LEFT JOIN pg_attrdef d ON d.adrelid=c.oid AND d.adnum=a.attnum
WHERE n.nspname IN ('public','private') AND c.relkind IN ('r','p')
ORDER BY n.nspname,c.relname,a.attnum;

-- 3. Constraints.
SELECT n.nspname AS schema_name, r.relname AS table_name, con.conname,
       con.contype, pg_get_constraintdef(con.oid,true) AS definition,
       con.convalidated AS is_validated
FROM pg_constraint con
JOIN pg_class r ON r.oid=con.conrelid
JOIN pg_namespace n ON n.oid=r.relnamespace
WHERE n.nspname IN ('public','private')
ORDER BY n.nspname,r.relname,con.conname;

-- 4. Index definitions.
SELECT schemaname,tablename,indexname,indexdef
FROM pg_indexes
WHERE schemaname IN ('public','private')
ORDER BY schemaname,tablename,indexname;

-- 5. RLS policies.
SELECT schemaname,tablename,policyname,permissive,roles,cmd,qual,with_check
FROM pg_policies
WHERE schemaname IN ('public','private')
ORDER BY schemaname,tablename,policyname;

-- 6. Application function definitions and security attributes.
SELECT n.nspname AS schema_name,p.proname AS function_name,
       pg_get_function_identity_arguments(p.oid) AS identity_arguments,
       pg_get_function_result(p.oid) AS result_type,
       p.prosecdef AS security_definer,p.provolatile AS volatility,
       p.proconfig AS function_settings,pg_get_functiondef(p.oid) AS definition
FROM pg_proc p
JOIN pg_namespace n ON n.oid=p.pronamespace
WHERE n.nspname IN ('public','private') AND p.prokind='f'
ORDER BY n.nspname,p.proname,pg_get_function_identity_arguments(p.oid);

-- 7. Non-internal triggers (including custom auth triggers).
SELECT n.nspname AS schema_name,c.relname AS table_name,t.tgname,
       pg_get_triggerdef(t.oid,true) AS definition,t.tgenabled
FROM pg_trigger t
JOIN pg_class c ON c.oid=t.tgrelid
JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname IN ('public','private','auth') AND NOT t.tgisinternal
ORDER BY n.nspname,c.relname,t.tgname;

-- 8. Table and function privileges for API and service roles.
SELECT 'table' AS object_type,table_schema AS schema_name,table_name AS object_name,
       grantee,privilege_type,is_grantable
FROM information_schema.role_table_grants
WHERE table_schema IN ('public','private')
  AND grantee IN ('anon','authenticated','service_role','postgres')
UNION ALL
SELECT 'routine',routine_schema,routine_name,grantee,privilege_type,is_grantable
FROM information_schema.role_routine_grants
WHERE routine_schema IN ('public','private')
  AND grantee IN ('anon','authenticated','service_role','postgres')
ORDER BY 1,2,3,4,5;

-- 9. Installed extensions (the full installed set, not only app-required ones).
SELECT e.extname, e.extversion, n.nspname AS extension_schema
FROM pg_extension e
LEFT JOIN pg_namespace n ON n.oid=e.extnamespace
ORDER BY e.extname;

-- 10. User-defined enum types in application schemas.
SELECT n.nspname AS schema_name,t.typname AS enum_name,
       array_agg(e.enumlabel ORDER BY e.enumsortorder) AS labels
FROM pg_type t
JOIN pg_namespace n ON n.oid=t.typnamespace
JOIN pg_enum e ON e.enumtypid=t.oid
WHERE n.nspname IN ('public','private')
GROUP BY n.nspname,t.typname
ORDER BY n.nspname,t.typname;

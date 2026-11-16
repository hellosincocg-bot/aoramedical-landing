export PGCONNECT_TIMEOUT=10
export PGPASSWORD="$SUPA_PGPASSWORD"
SUPA="-h supabase-db -U supabase_admin -d postgre_AcQ7n88F"
echo "== diag auth =="
psql $SUPA -v ON_ERROR_STOP=1 <<'SQL' 2>&1
select column_name, data_type, is_nullable, column_default is not null as def, is_generated from information_schema.columns where table_schema='auth' and table_name='users' order by ordinal_position;
select column_name, data_type, is_nullable, is_generated from information_schema.columns where table_schema='auth' and table_name='identities' order by ordinal_position;
select id,email,aud,role,email_confirmed_at is not null conf,left(encrypted_password,4) pw,raw_app_meta_data from auth.users;
select p.proname, pg_get_function_identity_arguments(p.oid) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='extensions' and p.proname in ('crypt','gen_salt');
select p.proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='auth';
SQL
echo "== fin =="
sleep 1500

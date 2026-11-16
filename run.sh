export PGCONNECT_TIMEOUT=10
export PGPASSWORD="$SUPA_PGPASSWORD"
SUPA="-h supabase-db -U supabase_admin -d postgre_AcQ7n88F"
echo "== diagnostico =="
psql $SUPA -c "select p.proname, pg_get_function_identity_arguments(p.oid) args, pg_get_userbyid(p.proowner) dueno, p.prosecdef, p.proacl from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.prokind='f' and not exists (select 1 from pg_depend dp where dp.objid=p.oid and dp.deptype='e') and not exists (select 1 from migracion.stmts s where s.ord=30 and s.sub = p.proname||'('||pg_get_function_identity_arguments(p.oid)||')')" 2>&1
psql $SUPA -c "select count(*) filter (where relrowsecurity) con_rls, count(*) tablas from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r'" 2>&1
echo "== fin =="
sleep 1500

export PGCONNECT_TIMEOUT=10
export PGPASSWORD="$SUPA_PGPASSWORD"
SUPA="-h supabase-db -U supabase_admin -d postgre_AcQ7n88F"
echo "== bloqueando tablas sin RLS (sin politicas = acceso denegado a usuarios de API) =="
psql $SUPA -v ON_ERROR_STOP=1 <<'SQL' 2>&1
do $$ declare r record; begin
  for r in select c.relname from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r' and not c.relrowsecurity loop
    execute format('alter table public.%I enable row level security', r.relname);
  end loop; end $$;
select count(*) filter (where relrowsecurity) con_rls, count(*) tablas from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r';
select count(*) usuarios_auth, count(*) filter (where is_anonymous) anonimos from auth.users;
SQL
echo "== fin =="
sleep 1500

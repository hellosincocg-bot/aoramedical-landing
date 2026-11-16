export PGCONNECT_TIMEOUT=8
echo "== resolviendo supabase-db =="
getent hosts supabase-db || echo "NO RESUELVE supabase-db"
echo "== Supabase =="
PGPASSWORD="$SUPA_PGPASSWORD" psql -h supabase-db -U supabase_admin -d postgre_AcQ7n88F -tAc "select current_user, current_database(), (select rolsuper from pg_roles where rolname=current_user)" 2>&1 | head -3
echo "== Neon =="
psql "$NEON_URL" -tAc "select current_user, count(*) from public.patients group by 1" 2>&1 | head -3
echo "== fin =="
sleep 2000

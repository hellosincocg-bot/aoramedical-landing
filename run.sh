export PGCONNECT_TIMEOUT=10
export PGPASSWORD="$SUPA_PGPASSWORD"
SUPA="-h supabase-db -U supabase_admin -d postgre_AcQ7n88F"
echo "== diagnostico de diferencias =="
psql $SUPA -v neon_conn="$NEON_URL" -f /app/diag.sql 2>&1 | tail -60
echo "== fin =="
sleep 1500

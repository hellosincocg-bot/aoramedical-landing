export PGCONNECT_TIMEOUT=10
export PGPASSWORD="$SUPA_PGPASSWORD"
SUPA="-h supabase-db -U supabase_admin -d postgre_AcQ7n88F"
echo "== estado inicial =="
N=$(psql $SUPA -tAc "select count(*) from information_schema.tables where table_schema='public'")
echo "tablas en public de Supabase: $N"
if [ "$N" != "0" ]; then
  echo "Supabase ya tiene tablas en public: no hago nada para no pisar datos."
else
  psql $SUPA -v ON_ERROR_STOP=1 -c "create schema if not exists migracion" -c "create extension if not exists dblink schema migracion" 2>&1
  echo "== aplicando esquema (una sola transaccion) =="
  psql $SUPA -1 -v ON_ERROR_STOP=1 -v neon_conn="$NEON_URL" -f /app/esquema.sql 2>&1 | tail -150
fi
echo "== fin =="
sleep 1500

export PGCONNECT_TIMEOUT=10
export PGPASSWORD="$SUPA_PGPASSWORD"
SUPA="-h supabase-db -U supabase_admin -d postgre_AcQ7n88F"
P=$(psql $SUPA -tAc "select count(*) from public.patients" 2>&1)
echo "pacientes ya en Supabase: $P"
if [ "$P" = "0" ]; then
  echo "== copiando datos (una sola transaccion) =="
  psql $SUPA -1 -v ON_ERROR_STOP=1 -v neon_conn="$NEON_URL" -f /app/datos.sql 2>&1 | tail -40
else
  echo "Supabase ya tiene datos: no copio de nuevo."
fi
echo "== verificando =="
psql $SUPA -v ON_ERROR_STOP=1 -v neon_conn="$NEON_URL" -f /app/verificar.sql 2>&1 | tail -80
echo "== fin =="
sleep 1500

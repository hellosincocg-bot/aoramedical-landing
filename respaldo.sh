#!/bin/sh
# Respaldo diario de Supabase: copia local (7 dias) + copia externa en Neon (7 dias) + prueba de restauracion.
export PGCONNECT_TIMEOUT=15
SUPA="-h supabase-db -U supabase_admin -d postgre_AcQ7n88F"
KEEP=7
hacer() {
  TS=$(date -u +%Y%m%d-%H%M)
  F=/backups/aora-$TS.dump
  export PGPASSWORD="$SUPA_PGPASSWORD"
  echo "[$TS] dump..."
  if ! pg_dump $SUPA -Fc -B --no-owner -f "$F.tmp"; then echo "[$TS] ERROR dump"; rm -f "$F.tmp"; return 1; fi
  mv "$F.tmp" "$F"
  SHA=$(sha256sum "$F" | cut -c1-64); BYTES=$(stat -c %s "$F")
  echo "[$TS] local OK $F $BYTES bytes"
  find /backups -name 'aora-*.dump' -mtime +$KEEP -delete
  # prueba de restauracion: base temporal, solo esquema public
  psql $SUPA -qc "drop database if exists restore_test" -c "create database restore_test" >/dev/null 2>&1
  pg_restore $SUPA -d restore_test --no-owner -n public "$F" >/dev/null 2>&1
  for t in patients appointments profiles; do
    A=$(psql $SUPA -d postgre_AcQ7n88F -Atc "select count(*) from public.$t"); B=$(psql $SUPA -d restore_test -Atc "select count(*) from public.$t" 2>/dev/null)
    [ "$A" = "$B" ] && echo "[$TS] restore-test $t OK ($A)" || echo "[$TS] restore-test $t DIFIERE vivo=$A copia=$B"
  done
  psql $SUPA -qc "drop database if exists restore_test" >/dev/null 2>&1
  # copia registrada en Supabase (para el boton de descarga del administrador)
  SOID=$(psql $SUPA -At -c "\lo_import '$F'" 2>&1 | grep -o '[0-9]*$' | tail -1)
  if [ -n "$SOID" ]; then
    psql $SUPA -v ON_ERROR_STOP=1 -qc "insert into respaldo.copias(nombre,bytes,sha256,oid_datos) values ('aora-$TS.dump',$BYTES,'$SHA',$SOID)" \
     && psql $SUPA -At -c "select lo_unlink(oid_datos) from respaldo.copias where creado < now() - interval '$KEEP days'" -c "delete from respaldo.copias where creado < now() - interval '$KEEP days'" >/dev/null \
     && echo "[$TS] supabase-descarga OK oid=$SOID" || echo "[$TS] ERROR registrando en Supabase"
  else echo "[$TS] ERROR importando en Supabase"; fi
  # copia externa en Neon
  OID=$(psql "$NEON_BK_URL" -At -c "\lo_import '$F'" 2>&1 | grep -o '[0-9]*$' | tail -1)
  if [ -n "$OID" ]; then
    psql "$NEON_BK_URL" -v ON_ERROR_STOP=1 -qc "insert into public.copias(nombre,bytes,sha256,oid_datos) values ('aora-$TS.dump',$BYTES,'$SHA',$OID)" \
     && psql "$NEON_BK_URL" -Atq -c "select lo_unlink(oid_datos) from public.copias where creado < now() - interval '$KEEP days'" -c "delete from public.copias where creado < now() - interval '$KEEP days'" >/dev/null \
     && echo "[$TS] neon OK oid=$OID" || echo "[$TS] ERROR registrando en Neon"
  else echo "[$TS] ERROR subiendo a Neon"; fi
}
hacer
while true; do
  # proxima ejecucion: 07:00 UTC (03:00 Caracas)
  NOW=$(date -u +%s); T=$(date -u -d "today 07:00" +%s 2>/dev/null || date -u +%s)
  [ "$T" -le "$NOW" ] && T=$((T+86400))
  sleep $((T-NOW)); hacer
done

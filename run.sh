export PGCONNECT_TIMEOUT=10
export PGPASSWORD="$SUPA_PGPASSWORD"
SUPA="-h supabase-db -U supabase_admin -d postgre_AcQ7n88F"
GOT=$(printf '%s' "$RUN_SQL" | tr -d ' \n\t' | sha256sum | cut -c1-64)
echo "sha recibido: $GOT esperado: $EXPECT_SHA"
if [ -n "$EXPECT_SHA" ] && [ "$GOT" != "$EXPECT_SHA" ]; then echo "SQL NO COINCIDE - no se ejecuta"; sleep 1500; exit 0; fi
echo "== ejecutando RUN_SQL =="
printf '%s\n' "$RUN_SQL" | psql $SUPA -v ON_ERROR_STOP=1 -1 -v users="$USERS_CSV" 2>&1
echo "== fin =="
sleep 1500

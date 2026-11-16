export PGCONNECT_TIMEOUT=10
export PGPASSWORD="$SUPA_PGPASSWORD"
SUPA="-h supabase-db -U supabase_admin -d postgre_AcQ7n88F"
GOT=$(printf '%s' "$RUN_SQL" | tr -d ' \n\t' | sha256sum | cut -c1-64)
if [ -n "$EXPECT_SHA" ] && [ "$GOT" != "$EXPECT_SHA" ]; then echo "SQL NO COINCIDE - no se ejecuta"; sleep 1500; exit 0; fi
echo "== ejecutando RUN_SQL (sha verificado, sin su ultima linea) =="
printf '%s\n' "$RUN_SQL" | sed '$d' | psql $SUPA -v ON_ERROR_STOP=1 -1 -v users="$USERS_CSV" 2>&1
echo "== verificacion =="
psql $SUPA <<'SQL' 2>&1
select count(*) funciones_con_neon_auth from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.prokind='f' and pg_get_functiondef(p.oid) ilike '%neon_auth%';
select p.proname, pg_get_function_identity_arguments(p.oid) args, p.prosecdef from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in ('activate_pending_user','change_own_password','admin_set_user_password','claim_user_invite','claim_user_provisional','reset_user_access_admin','reset_user_access_temp','bootstrap_claim_master','_aora_set_auth_user') order by 1,2;
SQL
echo "== fin =="
sleep 1500

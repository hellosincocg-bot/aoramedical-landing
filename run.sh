export PGCONNECT_TIMEOUT=10
export PGPASSWORD="$SUPA_PGPASSWORD"
SUPA="-h supabase-db -U supabase_admin -d postgre_AcQ7n88F"
echo "== diag RUN_SQL =="
printf '%s' "$RUN_SQL" | wc -c
printf '%s' "$RUN_SQL" | tr -cd '$' | wc -c
printf '%s\n' "$RUN_SQL" | grep -n 'security definer' | head -3
printf '%s\n' "$RUN_SQL" | grep -n 'claim_user_invite(jsonb)' -A2 | head -6
sleep 1500

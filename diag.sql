\set QUIET on
select migracion.dblink_connect('neon', :'neon_conn');
do $$
declare t text; r record;
begin
  foreach t in array array['appointment_status_history','audit_logs','medical_encounter_versions'] loop
    for r in
      execute format($f$
        with n as (select * from migracion.dblink('neon', 'select id, to_jsonb(x)::text from public.%1$I x') as q(id bigint, j text)),
        l as (select id, to_jsonb(x) j from public.%1$I x)
        select k.key, count(*) filas, min(n.id) ejemplo_id
        from n join l using (id), jsonb_each(l.j) k
        where (n.j::jsonb) -> k.key is distinct from k.value
        group by k.key order by 2 desc$f$, t)
    loop
      raise notice 'tabla=% columna=% filas_distintas=% ejemplo_id=%', t, r.key, r.filas, r.ejemplo_id;
    end loop;
  end loop;
end $$;
select 'tipos de las columnas que difieren' info;
select table_name, column_name, data_type from information_schema.columns where table_schema='public' and table_name in ('appointment_status_history','audit_logs','medical_encounter_versions') and data_type in ('jsonb','json','inet','interval','real','double precision','numeric','timestamp without time zone','timestamp with time zone') order by 1,2;

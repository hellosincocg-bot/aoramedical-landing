\set QUIET on
set client_min_messages = warning;
set session_replication_role = replica;
select migracion.dblink_connect('neon', :'neon_conn');

do $$
declare r record; cols text; coldef text; n bigint;
begin
  for r in select c.oid, c.relname from pg_class c join pg_namespace n on n.oid=c.relnamespace
           where n.nspname='public' and c.relkind='r' order by c.relname loop
    select string_agg(quote_ident(attname), ',' order by attnum),
           string_agg(quote_ident(attname)||' '||format_type(atttypid,atttypmod), ',' order by attnum)
      into cols, coldef
      from pg_attribute where attrelid=r.oid and attnum>0 and not attisdropped;
    execute format('insert into public.%I (%s) overriding system value select %s from migracion.dblink(%L, %L) as t(%s)',
                   r.relname, cols, cols, 'neon', 'select '||cols||' from public.'||quote_ident(r.relname), coldef);
  end loop;
end $$;

-- secuencias de columnas identidad: continuar despues del maximo
do $$
declare r record; m bigint;
begin
  for r in select c.relname, a.attname from pg_attribute a join pg_class c on c.oid=a.attrelid join pg_namespace n on n.oid=c.relnamespace
           where n.nspname='public' and c.relkind='r' and a.attidentity<>'' and not a.attisdropped loop
    execute format('select max(%I) from public.%I', r.attname, r.relname) into m;
    if m is not null then
      execute format('select setval(pg_get_serial_sequence(%L, %L), %s, true)', 'public.'||quote_ident(r.relname), r.attname, m);
    end if;
  end loop;
end $$;

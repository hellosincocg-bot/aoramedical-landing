\set QUIET on
set client_min_messages = warning;
select migracion.dblink_connect('neon', :'neon_conn');
\echo '--- verificacion fila a fila (cuenta + huella md5 del contenido) ---'
create temp table ver (tabla text, filas_neon bigint, filas_supabase bigint, huella_neon text, huella_supabase text);
do $$
declare r record; fn bigint; fs bigint; hn text; hs text;
begin
  for r in select c.relname from pg_class c join pg_namespace n on n.oid=c.relnamespace
           where n.nspname='public' and c.relkind='r' order by c.relname loop
    select t.n, t.h into fn, hn from migracion.dblink('neon', format('select count(*), coalesce(md5(string_agg(x::text, '''' order by x::text collate "C")),'''') from public.%I x', r.relname)) as t(n bigint, h text);
    execute format('select count(*), coalesce(md5(string_agg(x::text, '''' order by x::text collate "C")),'''') from public.%I x', r.relname) into fs, hs;
    insert into ver values (r.relname, fn, fs, hn, hs);
  end loop;
end $$;
select count(*) tablas, sum(filas_neon) filas_neon, sum(filas_supabase) filas_supabase,
       count(*) filter (where filas_neon<>filas_supabase) tablas_con_distinta_cuenta,
       count(*) filter (where huella_neon<>huella_supabase) tablas_con_distinto_contenido from ver;
select tabla, filas_neon, filas_supabase, (huella_neon=huella_supabase) mismo_contenido from ver where filas_neon<>filas_supabase or huella_neon<>huella_supabase order by 1;
select 'patients' tabla, filas_neon, filas_supabase from ver where tabla='patients';

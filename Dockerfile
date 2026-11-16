FROM postgres:17-alpine
COPY run.sh esquema.sql datos.sql verificar.sql /app/
CMD ["sh","/app/run.sh"]

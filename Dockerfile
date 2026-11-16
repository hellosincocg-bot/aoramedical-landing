FROM postgres:17-alpine
COPY run.sh esquema.sql /app/
CMD ["sh","/app/run.sh"]

FROM postgres:17-alpine
COPY respaldo.sh /app/respaldo.sh
CMD ["sh","/app/respaldo.sh"]

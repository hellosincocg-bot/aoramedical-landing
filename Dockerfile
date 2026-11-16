FROM postgres:17-alpine
COPY prueba.sh /prueba.sh
CMD ["sh","/prueba.sh"]

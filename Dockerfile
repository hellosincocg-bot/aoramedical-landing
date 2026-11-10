# Landing AoraMedical: sirve el archivo único ya construido (standalone/AoraMedical_Landing.html).
# Para regenerarlo desde el código fuente: npm install && npm run build && npm run standalone
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY standalone/AoraMedical_Landing.html /usr/share/nginx/html/index.html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1/healthz || exit 1

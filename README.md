# AoraMedical · Landing de captación

Landing comercial de AoraMedical (una solución de SINCO Consulting Group) para médicos independientes, consultorios, centros médicos y clínicas en Venezuela. Conversión única: agendar el **Diagnóstico Operativo** sin costo.

## Desplegar en Vercel

1. Sube esta carpeta a un repositorio (o arrástrala en vercel.com/new).
2. Vercel detecta Vite automáticamente (`vercel.json` ya está configurado): `npm install` → `npm run build` → carpeta `dist`.

## Antes de publicar: configuración obligatoria

Edita el bloque `CONFIG` al inicio de `src/main.js`:

| Clave | Qué poner | Si se deja vacío |
| --- | --- | --- |
| `WHATSAPP_NUMBER` | Configurado: `584149137107` | Los botones de WhatsApp llevan al formulario |
| `AGENDA_URL` | Enlace de reserva (Calendly, Cal.com, Google Calendar) | El último paso confirma por WhatsApp |
| `FORM_ENDPOINT` | URL que recibe el prospecto como JSON por POST (Google Apps Script, Formspree, Make, CRM) | El prospecto solo viaja por WhatsApp |

## Pendientes de contenido

- **Logo de SINCO Consulting Group:** listo en `public/brand/sinco.svg` (color, fondos claros) y `sinco-white.svg` (fondos oscuros).
- **Capturas reales:** las pantallas del hero, del recorrido del paciente y de los perfiles son maquetas en HTML. Cada una está marcada con un comentario en `index.html`; reemplázalas por capturas de un entorno de demostración con pacientes ficticios.

## Medición

Todos los eventos se envían a `window.dataLayer` (listo para Google Tag Manager / GA4):
`cta_click` (con ubicación y titular visible), `perfil_elegido`, `autodiagnostico_marca`, `recorrido_paso`, `formulario_paso1`, `formulario_paso2`, `lead_enviado`, `cita_agenda_click`, `whatsapp_click`, `faq_abierta`.

## Estructura

```
index.html                 Contenido y estructura (6 secciones + formulario)
src/styles.css             Sistema visual AoraMedical + estilos de la landing
src/main.js                Configuración, titular rotativo, autodiagnóstico, perfiles,
                           recorrido del paciente, formulario en 2 pasos, WhatsApp, medición
public/brand/              Logos e íconos de AoraMedical
scripts/build-standalone.mjs  Genera standalone/AoraMedical_Landing.html (un solo archivo)
```

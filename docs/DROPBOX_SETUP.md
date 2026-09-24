# Radar Meta + Dropbox

La evidencia pesada (capturas, videos, HTML, TXT y metadata) se guarda en Dropbox. Cloudflare Pages Functions actúa como intermediario privado para que el navegador pueda subir y visualizar archivos sin exponer el token de Dropbox.

## 1. Crear Dropbox App

En Dropbox Developers crea una app con acceso a la carpeta de la aplicación o al Dropbox completo. Para este proyecto es suficiente una carpeta dedicada.

Permisos mínimos recomendados:
- files.content.read
- files.content.write
- files.metadata.read
- account_info.read

## 2. Prueba rápida

Genera un access token en la consola de la app de Dropbox.

En Cloudflare Pages > meta-redes > Settings > Environment variables / Secrets agrega:

- DROPBOX_ACCESS_TOKEN = <token generado>
- DROPBOX_ROOT = /RADAR_META_TESIS

Vuelve a desplegar.

La página debe mostrar “Dropbox conectado”.

## 3. Producción estable

Para evitar depender de un access token temporal usa:

- DROPBOX_APP_KEY
- DROPBOX_APP_SECRET
- DROPBOX_REFRESH_TOKEN
- DROPBOX_ROOT=/RADAR_META_TESIS

Los endpoints del proyecto renuevan automáticamente el access token usando el refresh token.

## 4. Estructura creada por la web

/RADAR_META_TESIS/
  RUNS_INDEX.json
  PRIMERA_ENTREGA/
    META_YYYYMMDDHHMMSS/
      ...estructura original del bot...
  REVISIONES/
    META_YYYYMMDDHHMMSS/
      <ID_BIBLIOTECA>.json

## 5. Flujo

1. Bot genera carpeta/PAQUETE_WEB.
2. Admin entra a Radar Meta.
3. Evidencia Dropbox > Subir carpeta extraída (recomendado).
4. La web sube archivo por archivo en bloques de 6 MB.
5. La corrida queda registrada en RUNS_INDEX.json.
6. Cualquier revisor abre la corrida desde la web.
7. Las imágenes/videos se sirven desde Dropbox a través de /api/dropbox-file.
8. Cada validación se guarda también como JSON liviano dentro de /REVISIONES.

No se guarda evidencia pesada en Supabase.
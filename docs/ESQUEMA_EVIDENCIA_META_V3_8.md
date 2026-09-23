# Meta Ad Library — Evidencia completa v3.8

Este documento define el contrato de evidencia entre el bot local y el portal `radar-electoral`.

## Objetivo

El bot recolecta la información y conserva la evidencia maestra de forma local. La web recibe un paquete estandarizado para revisión colaborativa, clasificación humana, auditoría y publicación de resultados validados.

## Estructura por anuncio

Cada anuncio debe quedar autocontenido en una carpeta similar a:

```text
PARTIDOS/<PARTIDO>/CANDIDATOS/<CANDIDATO>/ANUNCIOS/<ID_BIBLIOTECA>/
├── CAPTURA_PAGINA.png
├── media_01_imagen.jpg
├── media_01_imagen_elemento.png
├── media_02_video.mp4
├── media_02_video_poster.jpg
├── media_02_video_elemento.png
├── metadata.json
└── multimedia.json
```

Si Meta bloquea la descarga directa de una imagen o video, el bot conserva la URL original y una captura visual del elemento como evidencia alternativa.

## Datos mínimos del anuncio

- Partido político
- Candidato / cuenta
- Nombre visible de la página
- Cargo
- ID de página origen
- ID Biblioteca Meta
- Link original del anuncio
- Estado
- Fecha de inicio y fin
- Plataformas
- Pagado por
- Tipo de pagador
- Rango de gasto
- Rango de impresiones
- Tamaño de audiencia cuando esté disponible
- Descripción / texto visible
- Clasificación automática preliminar de proselitismo
- Observaciones de auditoría
- Estado y calidad de extracción

## Evidencia multimedia

La v3.8 debe conservar **todas las piezas visibles** del anuncio, no únicamente la primera imagen o video.

Campos agregados al detalle:

- `TOTAL_MULTIMEDIA_EVIDENCIA`
- `MULTIMEDIA_ITEMS_JSON`
- `RUTAS_MULTIMEDIA_EVIDENCIA`
- `RUTA_CARPETA_ANUNCIO`
- `RUTA_METADATA_JSON`
- `RUTA_MULTIMEDIA_JSON`
- `RUTA_CAPTURA_PAGINA_ANUNCIO`

## Paquete web

La ejecución genera `02_PAQUETE_WEB/` y un ZIP listo para importar al portal.

El paquete contiene:

- `ANUNCIOS_WEB.json`
- `ANUNCIOS_WEB.csv`
- `RESUMEN_PARTIDOS_WEB.json`
- `RESUMEN_CANDIDATOS_WEB.json`
- `EVIDENCIAS_WEB.json`
- `WEB_RUN_INFO.json`
- evidencias PNG/JPG/MP4/HTML/TXT/JSON referenciadas

Cada archivo de evidencia se acompaña de tamaño y SHA-256 cuando existe localmente.

## Flujo de revisión web

```text
BOT LOCAL
  ↓
PAQUETE WEB
  ↓
ADMIN IMPORTA CORRIDA
  ↓
ASIGNACIÓN POR PARTIDO / CANDIDATO
  ↓
ANALISTA REVISA DATOS + GALERÍA MULTIMEDIA
  ↓
CLASIFICA: DIRECTA / INDIRECTA / NO ELECTORAL / PERSONAL / INSTITUCIONAL / OBSERVADO
  ↓
ADMIN VALIDA
  ↓
CONSOLIDADO VALIDADO + GRÁFICOS + VISTA PÚBLICA
```

## Principio de trazabilidad

La evidencia original local no se sustituye por la web. El portal es la capa de revisión y visualización; la carpeta local de la ejecución sigue siendo la fuente maestra.

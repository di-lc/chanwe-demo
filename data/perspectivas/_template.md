---
# ──────────────────────────────────────────────────────────────────────────────
# FRONT MATTER — metadatos del post
# Todos los campos son obligatorios salvo pdf.
# ──────────────────────────────────────────────────────────────────────────────

# Título completo del artículo. Aparece en la tarjeta y en el encabezado del detalle.
titulo: Título del post

# Resumen de 1-2 oraciones. Aparece debajo del título en la tarjeta del listado.
# No uses markdown acá — solo texto plano.
descripcion: Descripción breve que aparece en el listado.

# Categoría del contenido. Controla el filtro "Tipo" en el sidebar.
# Valores válidos: análisis | reflexión | tendencias | historia
tipo: análisis

# Etiquetas libres. Aparecen como pills en la tarjeta y en el sidebar "Etiquetas".
# Formato: [etiqueta1, etiqueta2]  — sin comillas, separadas por coma.
tags: [etiqueta1, etiqueta2]

# Industria del caso. Controla el filtro "Industria" en el sidebar.
# Valor libre: retail | tecnología | salud | educación | general | etc.
industria: general

# Mes y año de publicación. Se usa para el filtro "Archivo" en el sidebar.
# Formato: Mes YYYY  (en español, ej: Junio 2026)
fecha: Junio 2026

# Tiempo estimado de lectura. Se muestra en la tarjeta y en el detalle.
tiempoLectura: 5 min de lectura

# Ruta a la imagen de portada. Guardá la imagen en assets/06-perspectivas/.
# Formatos recomendados: .webp (mejor) o .jpg. Proporción sugerida: 16:9.
foto: assets/06-perspectivas/nombre-imagen.webp

# Texto alternativo de la imagen (para accesibilidad y SEO).
fotoAlt: Descripción de la imagen

# Visibilidad del post.
# publico  → el botón "Leer más" aparece y el post es accesible.
# privado  → solo muestra el botón de descarga PDF (para clientes).
acceso: publico

# URL al PDF descargable. Dejá vacío ("") si no hay PDF.
pdf: ""

---

<!--
  ────────────────────────────────────────────────────────────────────────────
  CUERPO DEL POST — escrito en Markdown

  REGLAS:
  1. Todo lo que escribas acá se renderiza como HTML en la página de detalle.
  2. Podés usar: **negrita**, _cursiva_, # títulos, listas, `código`, etc.
  3. Las secciones se definen con encabezados de nivel 2 (##).
  4. El texto antes del primer ## se usa como introducción/lead del artículo.
  5. Podés agregar tantas secciones ## como quieras entre la intro y la conclusión.

  SECCIONES RECONOCIDAS (el nombre del ## determina dónde se renderiza):
  ─ Cualquier texto antes del primer ##  →  introducción
  ─ ## Introducción (o variante)         →  introducción  
  ─ ## [cualquier nombre]                →  cuerpo del artículo
  ─ ## Conclusión / Cierre / Resumen     →  bloque de cierre
  ────────────────────────────────────────────────────────────────────────────
-->

Párrafo de apertura. Este texto aparece como lead antes de las secciones.
Planteá el problema o la pregunta central en 2-3 oraciones.

## El problema

Desarrollá el punto central del artículo. Podés escribir varios párrafos,
usar listas, negritas, etc.

- Elemento de lista 1
- Elemento de lista 2
- Elemento de lista 3

Continuá con más párrafos si lo necesitás. No hay límite de secciones `##`.

## Qué hacer al respecto

Sección intermedia opcional. Podés agregar ejemplos, datos o recomendaciones.

> Una cita o frase destacada se escribe así, con el símbolo `>` adelante.

## Conclusión

Cierre del artículo. Una o dos oraciones que sinteticen el aprendizaje clave.
Que sea directo y memorable.

---
# ──────────────────────────────────────────────────────────────────────────────
# FRONT MATTER — metadatos del informe
# Todos los campos son obligatorios salvo pdf.
# ──────────────────────────────────────────────────────────────────────────────

# Título completo del informe. Aparece en la tarjeta y en el encabezado del detalle.
titulo: Título del informe

# Resumen de 1-2 oraciones. Aparece debajo del título en la tarjeta del listado.
# No uses markdown acá — solo texto plano.
descripcion: Descripción breve que aparece en el listado.

# Categoría del documento. Controla el filtro "Categoría" en el sidebar.
# Valores válidos: Radar Macroeconómico | Informe Trimestral de la Economía | Enfoque Industrial | Business Buzz
categoria: Radar Macroeconómico

# Etiquetas libres. Aparecen como pills en la tarjeta y en el detalle.
# Formato: [etiqueta1, etiqueta2]  — sin comillas, separadas por coma.
tags: [etiqueta1, etiqueta2]

# Industria del caso. Controla el filtro "Industria" en el sidebar.
# Valor libre: retail | tecnología | salud | educación | general | etc.
industria: general

# Mes y año de publicación. Se usa para el filtro "Año" en el sidebar.
# Formato: Mes YYYY  (en español, ej: Mayo 2026)
fecha: Mayo 2026

# Número de páginas del documento. Se muestra en la tarjeta y en el detalle.
paginas: 20

# Ruta a la imagen de portada. Guardá la imagen en assets/07-informes/.
# Formatos recomendados: .webp (mejor) o .jpg. Proporción: 3:4 (portrait).
portada: assets/07-informes/nombre-informe.webp

# Texto alternativo de la imagen (para accesibilidad y SEO).
portadaAlt: Descripción de la portada

# Visibilidad del informe.
# publico  → el botón "Descargar PDF" aparece y es accesible.
# privado  → solo muestra un mensaje para clientes.
acceso: publico

# URL al PDF descargable. Guardá el PDF en assets/07-informes/.
# Dejá vacío ("") si no hay PDF disponible aún.
pdf: assets/07-informes/nombre-informe.pdf

---

<!--
  ────────────────────────────────────────────────────────────────────────────
  CUERPO DEL INFORME — escrito en Markdown

  REGLAS:
  1. Todo lo que escribas acá se renderiza como HTML en la página de detalle,
     en la sección "Resumen ejecutivo".
  2. Podés usar: **negrita**, _cursiva_, ## títulos, listas, `código`, etc.
  3. Este texto es el resumen ejecutivo del informe — no el informe completo.
     El documento completo se descarga como PDF.
  4. Longitud recomendada: 3-6 párrafos o equivalente con listas.

  ESTRUCTURA SUGERIDA:
  ─ Párrafo de contexto: ¿qué situación motivó este informe?
  ─ ## Qué encontramos  →  principales hallazgos
  ─ ## A quién le sirve →  industria y tamaño de empresa objetivo
  ─ ## Qué vas a encontrar  →  resumen de capítulos o secciones
  ────────────────────────────────────────────────────────────────────────────
-->

Párrafo de apertura. Explicá el contexto y la pregunta central del informe.
Quién lo encargó, en qué tipo de empresa surgió, qué problema resuelve.

## Qué encontramos

Los hallazgos principales del informe. Podés usar una lista:

- Hallazgo 1: descripción breve
- Hallazgo 2: descripción breve
- Hallazgo 3: descripción breve

## A quién le sirve

Este informe es útil para empresas en etapa de crecimiento del sector X que enfrentan Y.
Tamaño de empresa, industria y momento de aplicación.

## Qué vas a encontrar

El documento incluye los siguientes apartados:

1. Diagnóstico inicial
2. Análisis de causas
3. Recomendaciones accionables
4. Casos de referencia

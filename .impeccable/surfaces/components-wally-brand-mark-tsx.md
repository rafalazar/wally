---
version: 1
slug: "components-wally-brand-mark-tsx"
primary_target: "components/wally/brand-mark.tsx"
related_targets: ["components/wally/select.tsx","components/wally/header.tsx","components/wally/auth-boundary.tsx","components/wally/onboarding.tsx","components/wally/transaction-history.tsx","components/wally/insights.tsx","components/wally/cloud-workspace.tsx","app/globals.css","app/workspace.css","app/select.css","app/icon.svg"]
---

# Wally Mercado — identidad y selectores

## Direction contract

THESIS: Dos trazos enlazados forman una W abierta: una identidad cotidiana reconocible sin el antiguo recuadro oscuro de billetera.

OWN-WORLD: Coral #F45D37 y verde #008864 en el símbolo; tinta #263D30, fondo #FBFCF8 y superficies blancas. Plus Jakarta Sans y nombre en minúsculas. Controles claros de 44px, bordes definidos y opciones alineadas con marca de selección.

STORY: Reconocer Wally, registrar un movimiento y encontrarlo por categoría o mes con estados comprensibles.

FIRST VIEWPORT: Cabecera con símbolo de 44px y nombre de 28px; navegación y saldo conservan su lugar. En acceso, marca de 64px junto al nombre sobre título y acción Google. La bienvenida conserva monto protagonista. En Movimientos, filtros alineados bajo búsqueda; móvil apila categoría y divide mes/orden en dos columnas. Los paneles abiertos tienen filas de 44px y selección verde con check.

FORM: Fichas de mercado, candidata propia #1, elegida por el usuario frente a la asignada #7. Seed 958f53d3. Code-first; estudio vectorial .impeccable/mocks/decision/model-pick.svg como referencia de dirección, no comp obligatorio. Interacción distintiva: chevron gira al abrir el selector y la selección queda señalada con check y tinte verde; movimiento breve, desactivado con movimiento reducido.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

Límites: conservar Google, bienvenida y saldos; ingreso verde y gasto coral con etiquetas explícitas. Selectores HTML nativos con mejora progresiva, sin dependencia adicional. El usuario de prueba sigue limitado a desarrollo y loopback. Sin raster de producción ni cambios de base de datos.

## Documentation outcome — 2026-10-15

`DESIGN.md` registra la dirección aprobada Wally Mercado y sus valores de producción: coral de símbolo `#f45d37`, verde de símbolo `#008864`, verde de interfaz `#007e5c`, tinta `#263d30` y fondo compartido `#fbfcf8`. El verde de interfaz más oscuro sostiene texto, selección y foco; no reemplaza el verde del logo. Se conservan Plus Jakarta Sans, las funciones tipográficas de cifras y títulos, el espaciado y los flujos existentes; se añaden las medidas observadas de marca, selector y panel de cuenta.

La documentación derivada `.impeccable/design.json` sigue el esquema v2 de `reference/document.md`: metadatos y rampas para los 13 colores de producción, narrativa extraída de DESIGN.md y diez muestras autocontenidas con SVG, incluidas marca, select nativo y cuenta. Las rampas son muestras del panel, no tokens nuevos. Los valores de color del frontmatter se comprobaron contra `:root` de `app/globals.css`. `PRODUCT.md` añade únicamente el compromiso de marca confirmado y conserva el alcance y el usuario de prueba local.

Fuentes inspeccionadas: `app/globals.css`, `app/workspace.css`, `app/select.css`, `app/icon.svg`; `brand-mark.tsx`, `select.tsx`, `header.tsx`, `auth-boundary.tsx`, `onboarding.tsx`, `transaction-history.tsx`, `cloud-workspace.tsx` e `insights.tsx` bajo `components/wally/`. La marca usa dos trazos planos, el acceso ya no tiene el kicker anterior y su fondo usa `var(--background)`. Los selectores conservan semántica nativa y mejora progresiva; el panel de cuenta es plano y mantiene su gestión de foco.

No se canonizan los emojis de categorías, kickers ni sombras heredadas fuera de identidad/selectores. No se modificaron código de aplicación, migraciones, autenticación ni datos durante este pase documental. El estudio SVG de decisión es una referencia de dirección y no un comp de página ni un quality board externo. Los límites de navegador y sesión cloud permanecen en `.impeccable/review/identity-validation.md`.

La revisión inicial `.impeccable/review/identity-finish-review.md` pidió dos correcciones: documentación actualizada y fondo de acceso alineado con el contrato. El mismo revisor confirmó ambas como resueltas en `.impeccable/review/identity-verdict.md`, con `disposition: ship` y sin pendientes en ese lote. El veredicto final cubre esas dos correcciones; no representa una nueva revisión completa de la superficie.

---
version: 1
slug: "components-wally-auth-boundary-tsx"
primary_target: "components/wally/auth-boundary.tsx"
related_targets: ["components/wally/local-workspace.tsx","app/workspace.css"]
---

# Acceso de prueba local

Mode: Operate. Local development only; the owner enters a test wallet without Google to exercise onboarding and transactions.

THESIS: One clearly named secondary action opens an isolated, repeatable test session.
OWN-WORLD: Preserve Wally's existing cream login, typography, controls and income green. No new visual system.
STORY: Enter as Usuario de prueba, complete the existing initial-balance welcome, use the wallet, and optionally restart the disposable test.
FIRST VIEWPORT: Keep Google as the primary action. Below it, a full-width secondary button says Entrar como usuario de prueba, with a short note explaining browser-only storage. Remove the inherited decorative eyebrow in the edited login surface. A compact persistent notice identifies the test wallet and offers restart/sign-out.
FORM: Narrow extension of the existing sign-in and wallet screens; code-first. Seed: not applicable. Signature interaction: restart returns the same test user to the existing welcome without touching a Google account.
FINISH: Bounded desktop/mobile inspection, independent finish review and documentation check. No production raster assets.

Constraints: available only in development on loopback hosts; no credentials or Supabase identity spoofing. No shared-wallet simulation. Browser persistence and saved-state copy must accurately identify local data. Preserve production authentication.

## Documentación verificada — 2026-10-15

La extensión coincide con el sistema existente de `DESIGN.md` y `.impeccable/design.json`: mantiene el fondo crema, las superficies blancas, Plus Jakarta Sans y la jerarquía de títulos y cifras. No se regeneraron tokens ni sidecar. El botón local reutiliza la variante secundaria de `app/globals.css`, con ancho completo y altura mínima de 48px propios de esta superficie; Google conserva la acción primaria coral. La nota de almacenamiento queda separada por el borde cálido existente.

La banda reutiliza el verde claro del sistema y los botones de texto, con objetivos de 44px. Identifica al Usuario de prueba y sus datos locales; en móvil el texto ocupa una fila y las acciones se distribuyen debajo. El cierre de sesión de la bienvenida permanece en su encabezado existente; al entrar en la billetera también aparece en la banda. Esta adaptación conserva la bienvenida y el shell, sin introducir una composición global nueva, recursos raster de producción ni otra escala tipográfica.

Se contrastaron `components/wally/auth-boundary.tsx`, `components/wally/local-workspace.tsx`, `app/workspace.css`, los controles compartidos y la cabecera con el contrato anterior, `PRODUCT.md` y `README.md`. El flujo parte sin movimientos y reutiliza la bienvenida; reiniciar vuelve a ella y borra únicamente los datos y preferencias de prueba. Cerrar sesión conserva esos movimientos. Las etiquetas de estado, cuenta y privacidad distinguen almacenamiento local de Google/Supabase, según la revisión de cierre.

Evidencia visual inspeccionada: `.impeccable/review/local-{login,welcome,wallet}-{desktop,mobile}.png` (las seis capturas). Login conserva la prioridad de Google en escritorio y móvil; bienvenida y billetera mantienen el aviso local y la composición existente, sin recorte lateral de los controles añadidos. Dimensiones de archivo registradas por la revisión: login 1440×1000 / 390×844, bienvenida 1424×1068 / 390×967 y billetera 1440×1923 / 374×2090; las últimas cuatro incluyen la altura del documento.

La revisión independiente `.impeccable/review/local-access-review.md` concluye `ship`, sin correcciones materiales dentro del alcance. El implementador reporta 49 pruebas aprobadas, lint/build/TypeScript correctos, repetición UI dirigida 3/3 y exclusión del repositorio local del paquete de producción. Esta comprobación documental no vuelve a ejecutar pruebas ni detector.

No canonizado ni reparado: la nota final de `DESIGN.md` que afirmaba que el login aún contenía un kicker quedó desactualizada tras retirarlo en esta superficie. Se conserva ese archivo por el alcance acotado; los emojis heredados de categorías siguen fuera de esta extensión y no se convierten en reglas nuevas.

disposition: fix

Limitaciones: la tarjeta `model-pick` usa el propio estudio SVG como board; no hay QUALITY BAR independiente y el WebP opcional referenciado no existe. Se inspeccionó el SVG como fuente, las 14 capturas como imágenes y los archivos primarios por muestreo; no se abrió navegador ni se repitió el detector. El selector cloud no tiene captura de sesión real.

## persistence

Fail pendiente de documentación: `PRODUCT.md` existe y describe el público, los soles y el acceso de prueba; la ficha de superficie registra la elección explícita de Wally Mercado y el modo code-first. El padre corrobora el seed `958f53d3`, asignación #7 y confirmación `choice recorded`; el usuario eligió la candidata #1. No corresponde exigir estado, placas ni diffs de un comp obligatorio. Las 14 capturas requeridas existen y son válidas, incluida la ventana de 1280px; las tomas abiertas de menú móvil y el resumen de escritorio se valoraron como viewport, según el paquete. `DESIGN.md` aún prescribe fondo crema `#faf9f6`, tinta azulada, logo con degradado/relieve y el kicker de acceso que ya se retiró. La actualización prevista después de esta revisión sigue siendo necesaria para cerrar el trabajo.

## fidelity

Matriz contra el contrato; el estudio de decisión es referencia de crítica y no especificación de composición.

| Promesa | Estado | Evidencia |
| --- | --- | --- |
| TYPE | match | Plus Jakarta Sans, nombre en minúsculas y peso firme; la marca se lee a las escalas de acceso y cabecera. |
| MATERIAL | match | Dos trazos SVG redondeados y planos; superficies blancas, bordes definidos y acentos sin falsa textura ni volumen. El favicon conserva la misma geometría trasladada. |
| GROUND | contradicted | La aplicación y bienvenida usan el fondo contratado `#FBFCF8`. El acceso usa `#F0F7E6` en toda la página (`.auth-page`), visiblemente más verde que ese objetivo; la ficha no declara una excepción de fondo para acceso. |
| THESIS | match | La W abierta coral/verde sustituye la caja oscura con icono de billetera y permanece reconocible en todas las capturas. |
| OWN-WORLD | match salvo GROUND | Coral de símbolo `#F45D37`, verde de símbolo `#008864` y tinta `#263D30`; el verde de interfaz más oscuro sirve al contraste documentado. Selectores y filas con altura mínima de 44px. |
| STORY | match | Registro, Movimientos y Resumen permanecen encontrables. El estado seleccionado añade check, color y texto; los importes y las etiquetas mantienen el significado ingreso/gasto. |
| FIRST VIEWPORT | match | Cabecera y saldo conservan jerarquía. Acceso presenta símbolo/nombre y acción Google; bienvenida mantiene el monto dominante. En móvil, categoría ocupa una fila y mes/orden comparten la siguiente sin salto de línea. |
| FORM | match | Seed corroborado y candidata elegida registrados. El chevron gira, la selección usa verde y check, y `select.css` cancela su transición con movimiento reducido. La mejora progresiva mantiene el elemento select nativo. |

La prueba de memoria conserva la W bicolor y el nombre compacto. Las filas de opciones abiertas y el panel de cuenta se leen completos en las capturas; la verificación entregada cubre selección por teclado, Escape y foco. Los datos visibles están identificados como prueba. No se añadieron afirmaciones comerciales ni rasters de producción. Los emojis de categorías y la estructura anterior de formularios/gráficos quedan fuera del rediseño acordado; los elementos de identidad y selectores revisados no introducen esas convenciones heredadas.

## ceiling

Reached para la tarjeta elegida disponible: tinta plana, W de dos gestos, acentos vivos y controles táctiles. El estudio no plantea lettering, profundidad, ornamentación ni material adicional que el alcance de identidad haya dejado sin resolver. La ausencia de una tarjeta externa limita la comparación independiente; no justifica inventar adornos ni otro diseño de página.

## material_fixes

1. Fidelidad / GROUND: cambiar el fondo de `.auth-page` en `app/workspace.css` a `var(--background)` (`#FBFCF8`), como prescribe OWN-WORLD, y renovar `identity-login-desktop.png` e `identity-login-mobile.png` para confirmar ese ajuste.
2. Persistencia / FINISH: actualizar `DESIGN.md` y su documentación derivada para registrar Wally Mercado, los tokens actuales, la marca SVG plana, los selectores y el menú de cuenta; retirar las descripciones de identidad y kicker que contradicen el artefacto actual.

## keep

Conservar la W bicolor plana, la minúscula compacta, la separación ingreso/gasto, el check de selección, las filas de 44px y el select nativo con mejora progresiva; preservar el trabajo local previo de acceso de prueba.

# Validación de Wally Mercado

- El usuario eligió explícitamente Wally Mercado (coral y verde), candidata propia #1, mediante la pregunta estructurada tras cerrarse la página de opciones. Code-first permanece vigente.
- 31 pruebas de lógica/base de datos y 18 pruebas UI aprobadas; lint y compilación de producción correctos. Nueva compilación tras el ajuste CSS de ancho móvil.
- Navegador: acceso local, bienvenida con S/ 1,250.50, gasto de prueba de S/ 28.50, saldo S/ 1,222.00. No acceso ni cambios a cuentas reales.
- Selector categoría: flecha abajo y Enter seleccionan Alimentación y filtran a 1 movimiento. Escape cierra. Orden Mayor monto sitúa el saldo inicial primero. Mes septiembre del resumen muestra estado vacío; octubre recupera datos.
- Menú de cuenta: Tab llega a Mis movimientos; Escape cierra y devuelve foco al botón. Se conservan Tab y cierre exterior existentes, sin semántica de menú ARIA artificial.
- Vista móvil 390px: document.scrollWidth === innerWidth. Selectores a 16px; altura mínima 44px. Se corrigió el salto de línea de mes y orden mediante padding compacto y texto sin salto.
- Contraste de pares nuevos: texto verde #007E5C sobre selección #EDF7E8 = 4.61:1; apoyo #5E7065 sobre fondo #FBFCF8 = 5.12:1; blanco sobre acción #CF4322 = 4.69:1; tinta sobre blanco = 11.71:1. El verde del símbolo conserva #008864.
- El picker decorado usa CSS appearance: base-select dentro de @supports; fallback select nativo. Se verificó el camino mejorado en Chromium del navegador de Codex. No se ejecutó Safari/Firefox ni un dispositivo móvil físico. La selección de billetera cloud reutiliza el componente, pero no se simuló una sesión Supabase.
- Movimiento reducido: select.css cancela la transición del chevron y globals.css conserva la reducción global. Sin librerías nuevas ni imágenes raster de producción.
- Hook de Impeccable habilitado; no hubo hallazgos entregados por el hook en esta edición. No se ejecutó un detector duplicado.

Las capturas son evidencia de desarrollo con Usuario de prueba. La revisión visual cubrió acceso, bienvenida, formulario, historial, resumen y cuenta en escritorio/móvil, más el ancho de ventana de 1280px. Se sustituyeron capturas de gráficos tomadas antes de terminar la animación; no constituyen cambios del gráfico. El navegador puede excluir el gutter vertical de 16px al exportar una página completa.

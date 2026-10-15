---
name: Wally
description: Wally Mercado, una billetera cercana y fresca con una W coral y verde.
colors:
  background: "#fbfcf8"
  surface: "#fff"
  foreground: "#263d30"
  muted: "#5e7065"
  border: "#e0e7dc"
  coral: "#f45d37"
  coral-dark: "#cf4322"
  coral-light: "#fff1e9"
  green: "#007e5c"
  green-light: "#edf7e8"
  brand-green: "#008864"
  control-border: "#9aaa9c"
  control-hover: "#f2f5ed"
typography:
  display:
    fontFamily: "Plus Jakarta Sans, Arial, Helvetica, sans-serif"
    fontSize: "68px"
    fontWeight: 800
    lineHeight: 1.25
    letterSpacing: "-3px"
  headline:
    fontFamily: "Plus Jakarta Sans, Arial, Helvetica, sans-serif"
    fontSize: "clamp(26px, 2.5vw, 32px)"
    fontWeight: 800
    lineHeight: 1.35
    letterSpacing: "-1.25px"
  title:
    fontFamily: "Plus Jakarta Sans, Arial, Helvetica, sans-serif"
    fontSize: "20px"
    fontWeight: 750
    lineHeight: 1.5
    letterSpacing: "-0.7px"
  body:
    fontFamily: "Plus Jakarta Sans, Arial, Helvetica, sans-serif"
    fontSize: "14px"
  label:
    fontFamily: "Plus Jakarta Sans, Arial, Helvetica, sans-serif"
    fontSize: "12px"
    fontWeight: 550
  wordmark:
    fontFamily: "Plus Jakarta Sans, Arial, Helvetica, sans-serif"
    fontSize: "28px"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "-0.035em"
rounded:
  control: "11px"
  select: "12px"
  action: "14px"
  panel: "16px"
  card: "22px"
  dialog: "24px"
  form: "26px"
spacing:
  compact: "8px"
  related: "12px"
  inset: "16px"
  field: "20px"
  panel: "24px"
  generous: "32px"
components:
  button-primary:
    backgroundColor: "{colors.coral-dark}"
    textColor: "{colors.surface}"
    rounded: "{rounded.control}"
    padding: "13px 18px"
  button-secondary:
    backgroundColor: "#f7f5f1"
    textColor: "{colors.foreground}"
    rounded: "{rounded.control}"
    padding: "13px 18px"
  button-income:
    backgroundColor: "{colors.green}"
    textColor: "{colors.surface}"
    rounded: "13px"
    padding: "14px 18px"
  input:
    backgroundColor: "#faf8f5"
    textColor: "{colors.foreground}"
    rounded: "{rounded.control}"
  navigation:
    backgroundColor: "#eef2e7"
    rounded: "{rounded.action}"
    padding: "4px"
  amount-preset:
    backgroundColor: "#f3f4f6"
    textColor: "#5e697b"
    rounded: "9px"
    padding: "5px 12px"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.panel}"
    padding: "24px"
  card-balance:
    backgroundColor: "{colors.green-light}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.panel}"
    padding: "24px"
  select:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.select}"
    padding: "11px 42px 11px 14px"
  select-selected-option:
    backgroundColor: "{colors.green-light}"
    textColor: "{colors.green}"
    rounded: "8px"
    padding: "10px 12px"
  account-panel:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.panel}"
    padding: "16px"
    width: "310px"
  brand-mark:
    size: "44px"
---

# Design System: Wally

## Overview

**Creative North Star: "Wally Mercado"**

Wally Mercado es la dirección de marca cercana y fresca elegida por el usuario: una W abierta de dos trazos planos, coral y verde, junto al nombre en minúsculas. La tinta verde oscura, el fondo claro y las superficies blancas acompañan cifras protagonistas. Plus Jakarta Sans mantiene la continuidad entre la marca, los importes y las instrucciones en español.

La densidad cambia con la tarea: los resúmenes reúnen cifras en tarjetas y los formularios reservan espacio al importe. La identidad, la navegación, los selectores y el panel de cuenta se apoyan en bordes definidos y capas tonales planas. Este registro reconcilia `app/globals.css`, `app/workspace.css`, `app/select.css`, el favicon y los componentes de marca, acceso, bienvenida, cabecera, historial, billetera y resumen. La composición de cada superficie permanece en su ficha; el cambio de identidad no sustituye los flujos existentes.

**Key Characteristics:**

- W bicolor plana, nombre en minúsculas y tinta verde oscura.
- Fondo claro uniforme en acceso, bienvenida y aplicación; superficies blancas.
- Una sola familia tipográfica, pesos fuertes para cifras y títulos.
- Verde de interfaz para selección, ingresos y confirmación; coral para marca, acciones y gastos.
- Selectores nativos compartidos, filas de al menos 44px y foco visible.

## Colors

La paleta combina coral vivo y verde con neutros de matiz verde; el frontmatter conserva los valores de las variables CSS de producción.

### Primary

- **Coral** (`coral`, `coral-dark`, `coral-light`): marca, acciones generales y contexto de gastos. El tono oscuro sostiene botones con texto blanco; el claro aparece en estados y mensajes.

### Secondary

- **Verde de marca** (`brand-green`): segundo trazo del símbolo SVG y del favicon. Es distinto del verde de interfaz.
- **Verde de interfaz** (`green`, `green-light`): selección, navegación activa, foco, ingresos y confirmación de guardado. El tono oscuro sostiene texto y controles; el claro acompaña opciones seleccionadas y estados positivos. La bienvenida usa verde en el énfasis del título, el importe y su acción principal.

### Neutral

- **Fondo claro de mercado** (`background`): fondo compartido por acceso, bienvenida y aplicación.
- **Blanco** (`surface`): formularios, tarjetas y elementos seleccionados.
- **Tinta verde** (`foreground`): texto principal y cifras.
- **Verde gris de apoyo** (`muted`): información secundaria.
- **Borde suave** (`border`): separación de contenedores.
- **Borde de control** (`control-border`): contorno más definido de selectores y panel de cuenta.
- **Fondo de opción** (`control-hover`): respuesta al puntero en opciones y acciones de cuenta.

**The Semantic Color Rule.** El verde identifica selección, ingreso o confirmación según la etiqueta y el contexto; los gastos conservan la familia coral. El verde del símbolo no reemplaza al verde más oscuro de los controles y el texto.

## Typography

**Display Font:** Plus Jakarta Sans, con Arial, Helvetica y sans-serif como alternativas.
**Body Font:** La misma familia, cargada localmente con pesos variables de 200 a 800.

**Character:** Títulos y cantidades compactos, con pesos altos y espaciado ajustado. Las instrucciones usan pesos más ligeros y mayor interlineado; no hay una escala proporcional única.

### Hierarchy

- **Display:** importe principal del formulario de registro. Usa cifras tabulares; los importes largos reducen su tamaño mediante una variante explícita.
- **Headline:** títulos de página y de registro.
- **Title:** encabezados secundarios de sección.
- **Body:** base del documento; las explicaciones de formularios adaptan tamaño e interlineado a su contexto.
- **Label:** etiquetas de los campos, separadas del control por un espacio breve.

Los tokens conservan las funciones tipográficas existentes. El nombre de marca añade una función explícita: minúsculas, peso 800 y espaciado compacto. Se muestra a 28px en cabecera y bienvenida, 26px en el ajuste móvil global y 40px en acceso. El título ampliado y el importe de la bienvenida conservan sus propias medidas responsive en la ficha de superficie; no sustituyen la jerarquía de todas las páginas.

**The Complete Amount Rule.** Las cifras monetarias usan números tabulares y variantes para importes largos; la cifra completa y el prefijo de moneda deben seguir siendo legibles juntos.

## Layout

El contenido principal tiene un ancho máximo de 1280px y márgenes automáticos, con relleno lateral de 36px en escritorio. El encabezado admite 1360px. El formulario de registro ocupa hasta 660px y la lista reciente hasta 920px. Son medidas de las superficies existentes, no una plantilla obligatoria para cualquier pantalla.

Los espacios más frecuentes se registran en el frontmatter; el código combina esos valores con ajustes locales y no establece una cuadrícula estricta de ocho puntos. Las métricas usan tres columnas en escritorio. A 820px la navegación pasa a una fila completa y el contenido analítico se apila. A 600px el contenido usa 16px de margen lateral, las métricas pasan a dos columnas con el saldo a todo el ancho y los filtros de historial forman dos columnas con categoría a todo el ancho. El ajuste intermedio de escritorio ocurre a 1100px. Acceso y barra de billetera se adaptan a 640px; a ese ancho los selectores usan texto de 16px y relleno horizontal compacto.

La bienvenida tiene un cambio de composición propio a 760px. Su límite de ancho, dos columnas y orden móvil pertenecen a la ficha de esa superficie.

## Elevation & Depth

La identidad Mercado es plana: el símbolo no tiene degradado ni relieve. Acceso, bienvenida, métricas, navegación activa, selectores y panel de cuenta se separan mediante bordes y capas tonales, sin sombra. El relieve que permanece en historial, gráficos, registro y diálogos procede de superficies anteriores fuera de este rediseño; no es una instrucción para extenderlo a nuevos componentes Mercado.

### Existing depth outside this change

La variable `--shadow` sigue aplicada a historial y gráficos; el formulario de registro y los diálogos mantienen sus sombras locales. Se registran como límites de la migración visual, sin convertir esos valores en tokens de la nueva identidad. La antigua sombra de cuenta ya no existe.

## Shapes

Los controles usan esquinas pequeñas y los contenedores curvas más amplias. Los selectores y avatares tienen radio de 12px; acceso, métricas y panel de cuenta usan 16px en escritorio. El picker mejorado usa 14px y sus opciones 8px. Los bordes principales son de un píxel. Las cápsulas permanecen en el selector ingreso/gasto y el saldo del encabezado. Historial, formularios y diálogos conservan radios propios; no se reduce toda la aplicación a una única forma.

## Components

### Buttons

Acciones compactas con texto claro y estados visibles. Los botones generales primarios y secundarios comparten una altura mínima de 44px, peso 650 y la forma de control. El primario usa coral oscuro y oscurece al pasar el puntero; el secundario usa un fondo crema más marcado. El botón de texto conserva su variante ligera.

La bienvenida utiliza una acción verde de ancho completo y altura mínima de 54px, con texto a la izquierda y flecha SVG a la derecha. Al guardar cambia el texto y presenta un indicador; el estado deshabilitado reduce la opacidad a 0.55. El foco general usa un contorno verde de 2px separado 3px; la acción de bienvenida conserva un contorno verde de 3px separado 4px.

### Chips

Los importes rápidos son botones compactos con fondo gris claro y esquinas pequeñas. Al pasar el puntero adoptan el color del tipo de registro. Las categorías existentes comparten una selección por borde y fondo de acento; sus emojis heredados no se promueven como regla del sistema.

### Cards / Containers

Superficies blancas con borde suave y radios amplios. Las tarjetas de métricas usan 24px de relleno y son planas; el saldo añade fondo verde claro. Acceso tiene ancho máximo de 460px y relleno de 40px en escritorio. El formulario de registro conserva más espacio lateral y un radio mayor. La bienvenida mantiene una tarjeta plana con medidas propias.

### Inputs / Fields

Los campos comunes usan fondo crema suave, borde cálido y esquinas de control. Al recibir foco, el fondo pasa a blanco y aparece un borde con anillo del acento contextual. Los errores combinan texto explicativo con borde de error; no dependen solo del color. Los campos móviles de texto suben a 16px en las superficies existentes.

El importe es un control visualmente dominante con prefijo de moneda separado, números tabulares y una variante para valores largos. La bienvenida usa subrayado verde, un contorno explícito al recibir foco y un mensaje asociado al control cuando el monto es inválido.

### Navigation

El grupo principal se presenta en una capa verde clara con botones redondeados. La opción activa usa blanco, borde verde suave y texto verde; el hover usa coral oscuro. En pantallas estrechas, las tres opciones ocupan una fila completa. La bienvenida tiene únicamente marca y cierre de sesión, según su tarea.

### Brand

`BrandMark` reutiliza una W abierta de dos trazos SVG, con extremos y uniones redondeados, en acceso, bienvenida y cabecera. El símbolo mide 44px por defecto, 40px en el ajuste móvil global y 64px en acceso. El favicon repite esa geometría trasladada dentro de un fondo claro redondeado. El nombre se escribe `wally` en minúsculas; el nombre accesible sigue siendo Wally. No hay raster de producción para esta identidad.

**The Two Strokes Rule.** Conservar los dos trazos coral y verde y la palabra en minúsculas; la marca se reproduce como SVG plano, sin caja oscura, degradado ni sombra.

### Selectors

`Select` comparte un elemento HTML `select` entre billetera, categoría, mes, orden y mes del resumen. Conserva etiquetas, valores y eventos nativos, con chevron SVG decorativo. El control tiene altura mínima de 44px, fondo blanco, borde definido y foco verde. Con `appearance: base-select`, el picker añade filas de al menos 44px, check a la derecha y tinte verde en la selección; el hover es una capa suave. El texto cerrado se mantiene en una línea y las opciones abiertas pueden envolver.

La mejora vive dentro de `@supports`; los navegadores sin soporte usan el selector nativo del sistema. El chevron gira al abrirse y desactiva su transición con movimiento reducido. El mes del resumen conserva su etiqueta y calendario; la selección de billetera mantiene su propio estado de nube.

**The Native Selection Rule.** Reutilizar el select nativo con mejora progresiva, manteniendo etiqueta accesible, teclado y foco; el color de selección se acompaña de texto y check cuando el picker mejorado está disponible.

### Account panel

El botón de cuenta combina avatar de esquinas redondeadas, identidad y chevron; el estado abierto añade verde claro. El panel blanco tiene borde definido, radio de 16px y relleno de 16px. Sus acciones tienen altura mínima de 44px, SVG y hover suave; salir conserva coral oscuro. El estado de guardado diferencia explícitamente navegador de prueba y cuenta real.

El botón expone estado expandido y control asociado. Las acciones conservan el recorrido normal de Tab; Escape cierra y devuelve foco al botón, y salir del panel con foco o puntero exterior lo cierra. Es un panel de acciones con botones, sin un listbox ni un menú ARIA artificial.

### Confirmation

La confirmación de saldo inicial usa fondo verde claro, texto verde oscuro e icono SVG de verificación. Incluye el monto persistido y recibe foco una sola vez cuando la transacción guardada está disponible. Su llegada dura 220ms y se elimina cuando se solicita movimiento reducido. Los detalles de este estado se mantienen en la ficha de bienvenida.

**The Reduced Motion Rule.** La confirmación de bienvenida y el chevron de los selectores desactivan su movimiento con `prefers-reduced-motion`; se conserva también la reducción global existente.

## Do's and Don'ts

### Do:

- **Do** conservar la familia Plus Jakarta Sans y las cifras tabulares en importes.
- **Do** mantener el significado contextual del verde y del coral.
- **Do** reutilizar la W SVG plana y distinguir verde de marca de verde de interfaz.
- **Do** compartir el selector nativo y sus estados entre billetera, historial y resumen.
- **Do** comprobar el importe completo y el foco visible en los anchos móviles admitidos.
- **Do** acompañar errores y confirmaciones con texto en español.
- **Do** mantener los ajustes de composición particulares en la ficha de cada superficie.

### Don't:

- **Don't** convertir la composición de bienvenida en una plantilla global de la aplicación.
- **Don't** devolver a la marca la caja oscura, el degradado o el relieve del logo anterior.
- **Don't** extender los kickers decorativos ni los iconos de glifos heredados como reglas para nuevas superficies.
- **Don't** suprimir la alternativa de movimiento reducido de las confirmaciones.

No canonizado ni reparado: los emojis de categorías, los kickers y los tratamientos antiguos que permanecen fuera de identidad/selectores no son reglas para nuevas superficies. El acceso ya no contiene su kicker anterior. Las sombras de registro, historial, gráficos y diálogos se conservan fuera del alcance, sin promoverlas a la identidad Mercado. Las rampas tonales del sidecar son muestras para el panel de documentación, no nuevos tokens de producción. Esta actualización documenta el código; el veredicto de acabado permanece en la revisión de la superficie.

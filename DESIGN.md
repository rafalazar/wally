---
name: Wally
description: Una billetera personal de fondo crema, superficies blancas y cifras claras.
colors:
  background: "#faf9f6"
  surface: "#fff"
  foreground: "#1d2230"
  muted: "#6d788a"
  border: "#eae6e0"
  coral: "#ff6545"
  coral-dark: "#d94324"
  coral-light: "#fff3ee"
  green: "#008563"
  green-light: "#ecfaf3"
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
rounded:
  control: "11px"
  action: "14px"
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
    backgroundColor: "#f1efea"
    rounded: "{rounded.action}"
    padding: "4px"
  amount-preset:
    backgroundColor: "#f3f4f6"
    textColor: "#5e697b"
    rounded: "9px"
    padding: "5px 12px"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.card}"
    padding: "24px"
---

# Design System: Wally

## Overview

**Creative North Star: "Tu billetera personal"**

Wally presenta las finanzas cotidianas sobre un fondo crema, con superficies blancas y cifras protagonistas. La referencia verbal proviene de la interfaz existente; describe el sistema conservado y no introduce una nueva identidad de marca. Plus Jakarta Sans aporta continuidad entre la marca, los importes y las instrucciones en español.

La densidad cambia con la tarea: los resúmenes reúnen cifras en tarjetas y los formularios reservan espacio al importe. El color distingue acciones, ingresos y gastos; los bordes suaves separan áreas sin competir con el contenido. Este registro describe el código conservado en `app/globals.css`, `app/workspace.css` y los componentes muestreados. La composición y los estados particulares de la bienvenida se documentan en `.impeccable/surfaces/components-wally-onboarding-tsx.md`.

**Key Characteristics:**

- Fondo crema y superficies blancas con bordes cálidos.
- Una sola familia tipográfica, pesos fuertes para cifras y títulos.
- Verde de ingresos y confirmación; coral en la marca, acciones y gastos existentes.
- Controles redondeados, espaciado explícito y adaptación por superficie.

## Colors

La paleta combina neutros cálidos con coral y verde de función reconocible; el frontmatter conserva los valores de las variables CSS existentes.

### Primary

- **Coral** (`coral`, `coral-dark`, `coral-light`): marca, acciones generales y contexto de gastos. El tono oscuro sostiene botones con texto blanco; el claro aparece en estados y mensajes.

### Secondary

- **Verde de ingresos** (`green`, `green-light`): ingresos, estados positivos y confirmación de guardado. La bienvenida usa este verde en el énfasis del título, el importe y su acción principal.

### Neutral

- **Crema** (`background`): fondo de la aplicación.
- **Blanco** (`surface`): formularios, tarjetas y elementos seleccionados.
- **Tinta** (`foreground`): texto principal y cifras.
- **Gris de apoyo** (`muted`): información secundaria en las superficies existentes.
- **Borde cálido** (`border`): separación de controles y contenedores.

**The Semantic Color Rule.** El verde conserva el significado de ingreso o confirmación; el contexto de gasto conserva su familia coral. La restricción de coral a la marca en la bienvenida no cambia los usos existentes del resto de la aplicación.

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

Los tokens representan las funciones de la aplicación existente. El título ampliado y el importe de la bienvenida tienen sus propias medidas responsive en la ficha de superficie; no sustituyen la jerarquía de todas las páginas.

**The Complete Amount Rule.** Las cifras monetarias usan números tabulares y variantes para importes largos; la cifra completa y el prefijo de moneda deben seguir siendo legibles juntos.

## Layout

El contenido principal tiene un ancho máximo de 1280px y márgenes automáticos, con relleno lateral de 36px en escritorio. El encabezado admite 1360px. El formulario de registro ocupa hasta 660px y la lista reciente hasta 920px. Son medidas de las superficies existentes, no una plantilla obligatoria para cualquier pantalla.

Los espacios más frecuentes se registran en el frontmatter; el código combina esos valores con ajustes locales y no establece una cuadrícula estricta de ocho puntos. Las métricas usan tres columnas en escritorio. A 820px la navegación pasa a una fila completa y el contenido analítico se apila. A 600px el contenido usa 16px de margen lateral, y las métricas pasan a dos columnas con el saldo a todo el ancho. El ajuste intermedio de escritorio ocurre a 1100px; los controles de cuenta tienen un ajuste propio a 640px.

La bienvenida tiene un cambio de composición propio a 760px. Su límite de ancho, dos columnas y orden móvil pertenecen a la ficha de esa superficie.

## Elevation & Depth

El sistema combina bordes, capas tonales y sombras ambientales suaves. Las tarjetas de métricas e historial comparten una sombra cálida discreta; los diálogos y menús flotantes tienen mayor profundidad. El formulario de bienvenida se separa con blanco y borde, sin sombra. La marca conserva su pequeño degradado y su relieve existentes.

### Shadow Vocabulary

- **Tarjeta ambiental:** `0 12px 36px -18px rgb(43 35 25 / 13%), 0 1px 2px rgb(43 35 25 / 3%)`; variable compartida por tarjetas.
- **Formulario de registro:** `0 16px 46px -24px rgb(72 49 28 / 18%), 0 1px 2px rgb(43 35 25 / 3%)`.
- **Menú flotante:** `0 18px 60px -15px rgb(28 28 40 / 20%)`.
- **Diálogo:** `0 30px 100px rgb(19 20 29 / 20%)`, con fondo atenuado y desenfoque del contenido detrás.

## Shapes

Los controles usan esquinas pequeñas y las tarjetas, formularios y diálogos curvas más amplias. Los bordes principales son de un píxel. Las cápsulas quedan para selectores segmentados y el saldo del encabezado; los avatares son circulares. El sistema contiene ajustes móviles de radios y no reduce todas las formas a un único valor.

## Components

### Buttons

Acciones compactas con texto claro y estados visibles. Los botones generales primarios y secundarios comparten una altura mínima de 44px, peso 650 y la forma de control. El primario usa coral oscuro y oscurece al pasar el puntero; el secundario usa un fondo crema más marcado. El botón de texto conserva su variante ligera.

La bienvenida utiliza una acción verde de ancho completo y altura mínima de 54px, con texto a la izquierda y flecha SVG a la derecha. Al guardar cambia el texto y presenta un indicador; el estado deshabilitado reduce la opacidad a 0.55. El foco general usa un contorno coral claro de 3px separado 3px; la acción de bienvenida usa verde, separado 4px.

### Chips

Los importes rápidos son botones compactos con fondo gris claro y esquinas pequeñas. Al pasar el puntero adoptan el color del tipo de registro. Las categorías existentes comparten una selección por borde y fondo de acento; sus emojis heredados no se promueven como regla del sistema.

### Cards / Containers

Superficies blancas, borde cálido y radios amplios. Las tarjetas de métricas usan 24px de relleno y la sombra ambiental. El formulario de registro tiene más espacio lateral y un radio mayor. La bienvenida conserva una tarjeta plana con medidas propias.

### Inputs / Fields

Los campos comunes usan fondo crema suave, borde cálido y esquinas de control. Al recibir foco, el fondo pasa a blanco y aparece un borde con anillo del acento contextual. Los errores combinan texto explicativo con borde de error; no dependen solo del color. Los campos móviles de texto suben a 16px en las superficies existentes.

El importe es un control visualmente dominante con prefijo de moneda separado, números tabulares y una variante para valores largos. La bienvenida usa subrayado verde, un contorno explícito al recibir foco y un mensaje asociado al control cuando el monto es inválido.

### Navigation

El grupo principal se presenta en una superficie crema con botones redondeados. La opción activa usa blanco, tinta y una sombra ligera; el hover usa coral oscuro. En pantallas estrechas, las tres opciones ocupan una fila completa. La bienvenida tiene únicamente marca y cierre de sesión, según su tarea.

### Confirmation

La confirmación de saldo inicial usa fondo verde claro, texto verde oscuro e icono SVG de verificación. Incluye el monto persistido y recibe foco una sola vez cuando la transacción guardada está disponible. Su llegada dura 220ms y se elimina cuando se solicita movimiento reducido. Los detalles de este estado se mantienen en la ficha de bienvenida.

**The Reduced Motion Rule.** Las transiciones de estado conservan una alternativa sin movimiento; la confirmación de bienvenida desactiva su animación con `prefers-reduced-motion`.

## Do's and Don'ts

### Do:

- **Do** conservar la familia Plus Jakarta Sans y las cifras tabulares en importes.
- **Do** mantener el significado contextual del verde y del coral.
- **Do** comprobar el importe completo y el foco visible en los anchos móviles admitidos.
- **Do** acompañar errores y confirmaciones con texto en español.
- **Do** mantener los ajustes de composición particulares en la ficha de cada superficie.

### Don't:

- **Don't** convertir la composición de bienvenida en una plantilla global de la aplicación.
- **Don't** extender los kickers decorativos ni los iconos de glifos heredados como reglas para nuevas superficies.
- **Don't** suprimir la alternativa de movimiento reducido de las confirmaciones.

No canonizado ni reparado: el acceso todavía contiene un kicker decorativo y las categorías existentes usan emojis. Son elementos heredados fuera del alcance de esta bienvenida. Las rampas tonales del sidecar son muestras generadas para el panel de documentación, no nuevos tokens de producción.

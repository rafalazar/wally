# Configuración de Supabase y Google para Wally

## Estado verificado

- Proyecto: `wally`, referencia `zuzecdskahfsoiodgvrx`, activo.
- URL: https://zuzecdskahfsoiodgvrx.supabase.co
- Migración aplicada: `20260916023352_wally.sql`.
- Ocho tablas con RLS activado, relaciones, índices y permisos explícitos.
- URL y clave publicable configuradas en `.env.local`, excluido de Git.
- Registro abierto; acceso anónimo a movimientos rechazado por la API.
- Google habilitado y registro abierto, verificados con `scripts/check-supabase.mjs`.
- Dominio y despliegue de producción todavía no definidos.

## Decisiones de esta versión

Soles (PEN), billeteras privadas y compartidas, doce categorías iniciales más
categorías personalizadas. Todos los miembros de una billetera compartida pueden
editar todos sus movimientos; solo el propietario gestiona el acceso. Crédito es
un método de registro, sin gestión de deuda o cuotas. Presupuestos, metas,
recurrencias y cuentas bancarias no forman parte de esta integración.

Cada billetera tiene su moneda mediante una clave foránea. Agregar USD en una
versión posterior requerirá ampliar el catálogo, los validadores y la interfaz;
no se cambiará la moneda de registros existentes ni se sumarán monedas distintas.

## Relaciones

| Tabla | Relación y función |
| --- | --- |
| `auth.users` | Identidad gestionada por Supabase Auth, vinculada con Google. |
| `profiles` | Relación uno a uno con `auth.users`; nombre visible, sin contraseñas propias. |
| `wallets` | Propietario, nombre, tipo privado/compartido y moneda. Una personal por usuario. |
| `wallet_members` | Relación muchos a muchos entre usuarios y billeteras compartidas. El propietario se define solo en `wallets`. |
| `categories` | Categorías propias de cada billetera y tipo ingreso/gasto. Nombre único por billetera y tipo. |
| `transactions` | Relacionadas con billetera, categoría y tipo mediante clave foránea compuesta; método, céntimos, fechas, creador y versión. |
| `wallet_invitations` | Billetera, hash del código, vencimiento y aceptación. Códigos de un solo uso válidos durante siete días. |
| `currencies` | Catálogo de monedas y precisión; solo PEN habilitado. |
| `payment_methods` | Catálogo reutilizable de débito, crédito, efectivo y transferencia. |

Los saldos y resúmenes se calculan desde los movimientos. No se almacenan totales
independientes que puedan quedar desactualizados. El perfil y las categorías se
crean automáticamente al registrar una identidad. Las billeteras remotas nuevas
empiezan sin movimientos de ejemplo.

## Configurar Google OAuth en otro entorno

1. En [Google Cloud](https://console.cloud.google.com/projectcreate), crea o
   selecciona un proyecto para Wally.
2. En [Google Auth Platform](https://console.cloud.google.com/auth/overview),
   configura nombre de aplicación, correo de soporte y audiencia **External**.
   Solicita solamente `openid`, correo y perfil. Mientras esté en Testing, agrega
   las cuentas de prueba; para registro abierto, publica la aplicación OAuth.
3. Crea un cliente OAuth de tipo **Web application**. Para desarrollo:
   - Origen JavaScript autorizado: `http://localhost:3000`.
   - URI de redirección autorizada:
     `https://zuzecdskahfsoiodgvrx.supabase.co/auth/v1/callback`.
4. En [Authentication > Sign In / Providers de Supabase](https://supabase.com/dashboard/project/zuzecdskahfsoiodgvrx/auth/providers),
   habilita Google e introduce el **Client ID** y **Client Secret**. El secreto se
   guarda en Supabase, no en variables públicas de Next.js ni en el repositorio.
5. En [URL Configuration](https://supabase.com/dashboard/project/zuzecdskahfsoiodgvrx/auth/url-configuration),
   configura Site URL `http://localhost:3000` y permite como Redirect URL
   `http://localhost:3000/auth/callback`.
6. Ejecuta `node scripts/check-supabase.mjs` y confirma `googleEnabled: true`.
   Entra en Wally, pulsa Continuar con Google y comprueba que aparece tu billetera
   personal vacía. Cierra sesión y vuelve a entrar para verificar persistencia.

Son dos callbacks distintos: **Google vuelve a Supabase** y **Supabase vuelve a
Wally**. La aplicación intercambia el código usando PKCE y cookies, valida la
sesión en Proxy y mantiene las respuestas de sesión fuera de cachés compartidas.

Cuando exista un dominio de producción, registra su origen en Google, añade
`https://TU-DOMINIO/auth/callback` en Supabase y cambia Site URL al dominio público.
Configura las dos variables publicables en el alojamiento antes de construir y
desplegar. No uses comodines amplios para las redirecciones de producción.

## Verificación y límites

### Migración de notas opcionales

Antes de publicar la versión que permite guardar movimientos sin detalle, aplica
`supabase/migrations/20261015000000_optional_transaction_description.sql` al
proyecto correspondiente. Amplía la restricción a 0–160 caracteres y conserva
`NOT NULL`; no modifica movimientos existentes, permisos ni firmas de RPC.

La migración está incluida en las pruebas locales; su presencia en el repositorio
no confirma que esté aplicada en Supabase. El estado remoto verificado indicado
al inicio de esta guía corresponde a la migración inicial.

Publica después la aplicación y recarga las sesiones abiertas: el cliente anterior
rechaza detalles vacíos al leer movimientos. Para volver a una versión anterior,
mantén el cliente compatible con notas vacías mientras existan dichos registros;
no restaures la restricción antigua ni rellenes notas de usuarios automáticamente.

`npm test` ejecuta las migraciones en PostgreSQL en memoria, con usuarios
independientes y roles `anon` y `authenticated`. Prueba aislamiento, relación entre
billetera/categoría/tipo, invitaciones y retirada de miembros, conflictos de
edición, validación monetaria y creación de billeteras vacías con saldo cero.

La revisión remota de seguridad señala cuatro RPC `SECURITY DEFINER` ejecutables
por usuarios autenticados: creación de billeteras, creación/aceptación de
invitaciones y listado de miembros. Es intencional: requieren operar sobre filas
que no se exponen directamente al cliente. Cada función fija `search_path`,
comprueba identidad o pertenencia/propiedad y deniega acceso anónimo. Las pruebas
incluyen intentos de uso desde cuentas ajenas. Consultar el
[aviso y criterios de revisión de Supabase](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable).

La sincronización usa consultas periódicas cada 30 segundos y al recuperar foco;
no se promete funcionamiento sin conexión ni sincronización instantánea. Google
está habilitado; la verificación del flujo completo con dos cuentas se realiza
iniciando sesión en el navegador.

El único acceso a las billeteras es mediante Google. La antigua ruta `/demo`
redirige a `/` y la aplicación no genera ni carga movimientos de ejemplo. Las
billeteras locales anteriores no se leen ni se importan a Supabase. Las categorías
iniciales y los métodos de pago son catálogos para registrar movimientos propios.

## Referencias

- [Supabase SSR con Next.js](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [Configuración de Google](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Claves API](https://supabase.com/docs/guides/getting-started/api-keys)
- [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)

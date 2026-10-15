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
categorías personalizadas y una categoría reservada para el saldo inicial. Todos los miembros de una billetera compartida pueden
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
crean automáticamente al registrar una identidad. Tras aplicar la migración de
bienvenida, las cuentas nuevas completan un saldo inicial positivo antes de usar
su billetera personal. No se crean movimientos de ejemplo.

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
   personal. Una cuenta creada tras la migración de bienvenida debe registrar su
   saldo inicial; una cuenta anterior accede directamente. Cierra sesión y vuelve
   a entrar para verificar que no se repite la bienvenida.

Son dos callbacks distintos: **Google vuelve a Supabase** y **Supabase vuelve a
Wally**. La aplicación intercambia el código usando PKCE y cookies, valida la
sesión en Proxy y mantiene las respuestas de sesión fuera de cachés compartidas.

Cuando exista un dominio de producción, registra su origen en Google, añade
`https://TU-DOMINIO/auth/callback` en Supabase y cambia Site URL al dominio público.
Configura las dos variables publicables en el alojamiento antes de construir y
desplegar. No uses comodines amplios para las redirecciones de producción.

## Verificación y límites

### Bienvenida con saldo inicial

Migración nueva: `supabase/migrations/20261015010000_initial_balance_onboarding.sql`.
Se entrega para que el propietario la ejecute; no se ha confirmado su aplicación
remota. El corte entre cuentas existentes y nuevas ocurre al aplicar esta migración.
Las cuentas existentes quedan completadas sin crear movimientos, aunque estén vacías.

Desde PowerShell, en la raíz de Wally, con la CLI autenticada y el proyecto vinculado:

```powershell
npx supabase db push --dry-run
npx supabase db push
npx supabase migration list
```

Revisa el ensayo antes de ejecutar el segundo comando. Debe incluir la migración
`20261015010000`; si la anterior de notas opcionales sigue pendiente, también debe
aplicarse antes. La migración inicial `20260916023352` ya está documentada como
aplicada: si aparece pendiente, revisa el historial antes de continuar.

Para la primera conexión de la CLI:

```powershell
if (-not (Test-Path "supabase/config.toml")) { npx supabase init }
npx supabase login
npx supabase link --project-ref zuzecdskahfsoiodgvrx
```

Aplica primero la migración y despliega el cliente actualizado inmediatamente
después. En ese intervalo, el cliente antiguo no puede registrar movimientos en
las billeteras personales nuevas pendientes. Recarga las sesiones abiertas: el
cliente anterior no admite el método nulo de los saldos iniciales. No reviertas
al cliente anterior una vez existan estos registros; conserva la compatibilidad
con método nulo al hacer una corrección.

La RPC `complete_onboarding(p_amount_cents)` obtiene la identidad desde `auth.uid()`,
bloquea el perfil y guarda categoría, ingreso y finalización en una sola transacción.
Los reintentos devuelven el mismo resultado. Solo opera sobre la billetera personal;
la categoría `opening_balance` y el método nulo quedan reservados a ese ingreso.
El identificador y un contador de versión sobreviven a su eliminación, evitando
duplicados y ediciones antiguas tras deshacer. Los permisos del perfil siguen
limitando la escritura directa al nombre visible.

Verificación manual después del despliegue: cuenta nueva de Google, monto positivo,
saldo e ingreso del mes correctos, una sola fila Saldo inicial y sin método; luego
recarga, nueva sesión, edición, eliminación/deshacer y CSV. Una cuenta existente
(incluso vacía) debe acceder directamente; una compartida debe conservar su flujo.

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
edición, validación monetaria, bienvenida atómica y cuentas existentes sin cambios.

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

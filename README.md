# Wally

Aplicación de finanzas personales en soles con Next.js 16.3, React 19 y Supabase.
Incluye billeteras privadas y compartidas, categorías personalizadas, historial,
resumen mensual y exportación a CSV.

## Desarrollo

Requiere Node.js 22.18 o posterior.

```sh
npm install
npm run dev
```

Copia `.env.example` a `.env.local` y completa la URL y la clave publicable de
Supabase. Las variables están excluidas de Git. El proyecto configurado en este
entorno es `zuzecdskahfsoiodgvrx`.

- `/`: acceso con Google y billeteras de la cuenta.
- `/auth/callback`: intercambio del código OAuth y creación de la sesión.
- `/demo`: redirige al inicio de sesión para los enlaces antiguos.
- El acceso requiere una sesión de Google. Sin variables de Supabase, se muestra
  el inicio de sesión como no disponible y no se abre ninguna billetera local.

La base remota tiene la migración inicial y Google está habilitado en Supabase.
Consulta [la guía de Supabase y Google](docs/supabase-setup.md).

## Comprobaciones

```sh
npm test
npm run test:ui
npm run lint
npm run build
node scripts/check-supabase.mjs
```

Los tests usan PostgreSQL en memoria mediante PGlite y no escriben en tu proyecto
remoto. Comprueban permisos entre usuarios, invitaciones, relaciones, concurrencia,
validación monetaria, categorías, exportación y billeteras nuevas vacías. El último
comando verifica la conexión real, el proveedor Google y el bloqueo de acceso
anónimo; requiere conexión a internet y no imprime claves.

Las pruebas de interfaz usan un repositorio en memoria: comprueban registros
consecutivos, entrada de montos y notas opcionales sin escribir en Supabase.

## Modelo de datos

`profiles`, `wallets`, `wallet_members`, `categories`, `transactions`,
`wallet_invitations`, `currencies` y `payment_methods`, además de `auth.users`.

- Cada usuario recibe una billetera personal vacía, con saldo cero y doce
  categorías iniciales para registrar sus propios movimientos.
- El propietario crea billeteras compartidas y gestiona sus miembros.
- Todos los miembros pueden ver, registrar, editar y eliminar sus movimientos.
- Los códigos de invitación son de un solo uso, vencen a los siete días y se
  guardan como hashes. No se envían correos automáticamente.
- Los importes se almacenan como céntimos enteros; los saldos se calculan desde
  los movimientos. Cada billetera tiene una moneda. La versión actual admite PEN.
- El detalle es una nota opcional de hasta 160 caracteres. Sin nota, el historial
  muestra la categoría y el CSV conserva el detalle vacío.
- Débito, crédito, efectivo y transferencia son métodos de registro. No se
  administran cuentas bancarias, deuda, cuotas ni ciclos de tarjeta.
- Las relaciones incluyen la billetera y el tipo de categoría; RLS protege todas
  las tablas. La identidad del creador no se puede modificar desde el cliente.
- Las ediciones utilizan versiones para detectar cambios de otros miembros.
- La caché y las preferencias se separan por usuario y billetera. La nube se
  actualiza cada 30 segundos y al volver a la aplicación; guardar requiere internet.

## Organización

- `supabase/migrations/`: SQL versionado, alineado con el historial remoto.
- `lib/supabase/`: clientes SSR/navegador, tipos generados y repositorio remoto.
- `proxy.ts`: renovación y validación de sesión, con respuestas sin caché compartida.
- `components/wally/`: autenticación, billeteras, formularios, historial y resumen.
- `lib/finance.ts`: esquemas Zod, dinero, categorías, fechas y CSV.
- `lib/wallet-store.ts`: tipos de operaciones del repositorio de billeteras.

Wally ya no genera datos de ejemplo ni lee billeteras locales. Los registros
antiguos de este navegador no se muestran ni se importan a ninguna cuenta.
En el navegador solo se conservan las preferencias separadas por usuario y
billetera, además de la sesión gestionada por Supabase.

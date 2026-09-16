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
- `/demo`: ejemplos en soles, guardados únicamente en el navegador.
- Sin variables de Supabase, la aplicación muestra el modo local explícitamente.

La base remota ya tiene la migración inicial. Falta crear el cliente OAuth de
Google Cloud y habilitarlo en Supabase para completar el inicio de sesión real.
Consulta [la guía de Supabase y Google](docs/supabase-setup.md).

## Comprobaciones

```sh
npm test
npm run lint
npm run build
node scripts/check-supabase.mjs
```

Los tests usan PostgreSQL en memoria mediante PGlite y no escriben en tu proyecto
remoto. Comprueban permisos entre usuarios, invitaciones, relaciones, concurrencia,
validación monetaria, categorías, exportación y persistencia local. El último
comando verifica la conexión real, el proveedor Google y el bloqueo de acceso
anónimo; requiere conexión a internet y no imprime claves.

## Modelo de datos

`profiles`, `wallets`, `wallet_members`, `categories`, `transactions`,
`wallet_invitations`, `currencies` y `payment_methods`, además de `auth.users`.

- Cada usuario recibe una billetera personal y doce categorías iniciales.
- El propietario crea billeteras compartidas y gestiona sus miembros.
- Todos los miembros pueden ver, registrar, editar y eliminar sus movimientos.
- Los códigos de invitación son de un solo uso, vencen a los siete días y se
  guardan como hashes. No se envían correos automáticamente.
- Los importes se almacenan como céntimos enteros; los saldos se calculan desde
  los movimientos. Cada billetera tiene una moneda. La versión actual admite PEN.
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
- `lib/wallet-store.ts`: repositorio local de la demo.

Los registros anteriores bajo `wally.wallet.v1` eran USD y se conservan intactos.
La demo en soles usa `wally.wallet.pen.v1`. No hay conversión ni importación
silenciosa de los datos anteriores; tampoco se suben ejemplos a Supabase.

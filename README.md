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
- En producción, el acceso requiere una sesión de Google.

### Usuario de prueba local

Ejecuta `npm run dev`, abre `http://localhost:3000` y pulsa **Entrar como usuario de
prueba**. El botón también está disponible sin configurar Supabase. El usuario
`Usuario de prueba` empieza con la bienvenida y permite registrar, editar, eliminar,
deshacer y exportar movimientos. No requiere contraseña ni crea una cuenta remota.

Los datos se guardan en una clave propia de `localStorage`; la sesión de prueba se
mantiene en la pestaña al recargar. **Cerrar sesión** conserva sus movimientos.
**Reiniciar prueba** borra solo esa billetera y sus preferencias para repetir la
bienvenida. No lee ni importa billeteras locales antiguas ni datos de Google.
El botón solo funciona con `npm run dev` en localhost, 127.0.0.1 o ::1; la billetera
de prueba se excluye de la compilación de producción. No simula Google, RLS ni
billeteras compartidas: esas comprobaciones siguen usando Supabase.

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
validación monetaria, categorías, exportación y bienvenida con saldo inicial. El último
comando verifica la conexión real, el proveedor Google y el bloqueo de acceso
anónimo; requiere conexión a internet y no imprime claves.

Las pruebas de interfaz usan un repositorio en memoria: comprueban registros
consecutivos, entrada de montos, notas opcionales y bienvenida obligatoria sin
escribir en Supabase. El flujo de Google real requiere una cuenta nueva de prueba.

## Modelo de datos

`profiles`, `wallets`, `wallet_members`, `categories`, `transactions`,
`wallet_invitations`, `currencies` y `payment_methods`, además de `auth.users`.

- Las cuentas nuevas tras la migración de bienvenida registran un saldo inicial
  positivo antes de acceder a la billetera personal. Las cuentas anteriores no
  reciben la bienvenida. La finalización se conserva entre sesiones y dispositivos.
- El saldo inicial es un ingreso real, con su categoría reservada y sin método de
  pago. Se puede corregir, eliminar y deshacer sin repetir la bienvenida. Los
  reintentos de creación no duplican el ingreso. Las compartidas empiezan vacías.
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

- `supabase/migrations/`: SQL versionado; comprobar las pendientes con la CLI antes de desplegar.
- `lib/supabase/`: clientes SSR/navegador, tipos generados y repositorio remoto.
- `proxy.ts`: renovación y validación de sesión, con respuestas sin caché compartida.
- `components/wally/`: autenticación, billeteras, formularios, historial y resumen.
- `lib/finance.ts`: esquemas Zod, dinero, categorías, fechas y CSV.
- `lib/wallet-store.ts`: tipos de operaciones del repositorio de billeteras.

El acceso con Google no genera datos de ejemplo ni lee billeteras locales. Los registros
antiguos de este navegador no se muestran ni se importan a ninguna cuenta.
En el navegador se conservan las preferencias separadas por usuario y billetera,
además de la sesión gestionada por Supabase. El usuario de prueba de desarrollo
mantiene sus propios datos locales aislados.

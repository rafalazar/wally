import { z } from "zod";
import { categories, initialBalanceCategory, INITIAL_BALANCE_CATEGORY, localDate, transactionSchema, walletSchema, type Transaction } from "./finance.ts";
import type { WalletCommand, WalletRepository } from "./wallet-store.ts";

export const LOCAL_TEST_WALLET_KEY = "wally.development.wallet.v1";
export const LOCAL_TEST_SCOPE = "development-test-user:personal";
export const LOCAL_TEST_USER = { id: "development-test-user", name: "Usuario de prueba" } as const;
const stateSchema = z.object({
  schemaVersion: z.literal(1), completedAt: z.string().nullable(), initialId: z.string().nullable(),
  initialVersion: z.number().int().nonnegative(), wallet: walletSchema,
});
export type LocalTestState = z.infer<typeof stateSchema>;
type Storage = Pick<globalThis.Storage, "getItem" | "setItem">;
const emptyState = (): LocalTestState => ({ schemaVersion: 1, completedAt: null, initialId: null, initialVersion: 0,
  wallet: { version: 1, currency: "PEN", categories: categories.map(item => ({ ...item })), transactions: [] } });

export function createLocalTestWallet(storage: Storage) {
  function read(): LocalTestState {
    try {
      const saved = storage.getItem(LOCAL_TEST_WALLET_KEY);
      return saved === null ? emptyState() : stateSchema.parse(JSON.parse(saved));
    } catch { throw new Error("No pudimos leer la prueba local. Reintenta o reinicia la prueba."); }
  }
  function write(state: LocalTestState) {
    const valid = stateSchema.parse(state);
    try { storage.setItem(LOCAL_TEST_WALLET_KEY, JSON.stringify(valid)); }
    catch { throw new Error("No pudimos guardar en este navegador. Revisa el espacio y los permisos de almacenamiento e inténtalo otra vez."); }
    return valid;
  }
  function completeOnboarding(amountCents: number) {
    const state = read();
    if (state.completedAt) return state;
    const now = new Date();
    const parts = new Intl.DateTimeFormat("en", { timeZone: "America/Lima", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
    const part = (name: string) => parts.find(item => item.type === name)!.value;
    const transaction = transactionSchema.parse({ id: crypto.randomUUID(), type: "income", amountCents,
      description: "Saldo inicial", category: INITIAL_BALANCE_CATEGORY, paymentMethod: null,
      date: `${part("year")}-${part("month")}-${part("day")}`, createdAt: now.toISOString(), version: 1 });
    return write({ ...state, completedAt: now.toISOString(), initialId: transaction.id, initialVersion: 1,
      wallet: { ...state.wallet, categories: [...state.wallet.categories, initialBalanceCategory], transactions: [transaction] } });
  }
  const repository: WalletRepository = {
    async load() { return read().wallet; },
    async execute(command: WalletCommand) {
      const state = read();
      if (!state.completedAt) throw new Error("Completa tu saldo inicial antes de registrar movimientos.");
      if (command.type === "add-category") {
        if (command.category.id === INITIAL_BALANCE_CATEGORY || command.category.label.trim().toLowerCase() === "saldo inicial") {
          throw new Error("Saldo inicial está reservado para la bienvenida.");
        }
        return { data: write({ ...state, wallet: { ...state.wallet, categories: [...state.wallet.categories, command.category] } }).wallet };
      }
      const id = command.type === "remove" ? command.id : command.transaction.id;
      const previous = state.wallet.transactions.find(item => item.id === id);
      if (command.type === "update" || command.type === "remove") {
        const version = command.type === "remove" ? command.version : command.transaction.version;
        if (!previous || version !== previous.version) throw new Error("El movimiento cambió. Cierra el detalle y vuelve a abrirlo.");
      } else if (previous) throw new Error("Este movimiento ya existe en la prueba.");
      let saved: Transaction | undefined;
      if (command.type !== "remove") {
        saved = transactionSchema.parse(command.transaction);
        if (saved.date > localDate()) throw new Error("La fecha debe ser hasta el día de hoy.");
        if (id === state.initialId || saved.category === INITIAL_BALANCE_CATEGORY) {
          if (id !== state.initialId || saved.category !== INITIAL_BALANCE_CATEGORY || saved.type !== "income" || saved.paymentMethod !== null || command.type === "add") {
            throw new Error("El saldo inicial conserva su identidad, categoría y tipo de ingreso, sin método de pago.");
          }
          state.initialVersion++;
          saved.version = state.initialVersion;
        } else saved.version = (previous?.version ?? 0) + 1;
      }
      const result = write({ ...state, wallet: { ...state.wallet,
        transactions: [...(saved ? [saved] : []), ...state.wallet.transactions.filter(item => item.id !== id)] } });
      return { data: result.wallet, previous: previous && saved ? { ...previous, version: saved.version } : previous };
    },
  };
  return { read, repository, completeOnboarding, reset: () => write(emptyState()) };
}

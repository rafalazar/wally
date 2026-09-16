import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { z } from "zod";
import { categoryDefinitionSchema, transactionSchema, walletSchema, type Transaction, type WalletData } from "../finance";
import type { WalletCommand, WalletRepository } from "../wallet-store";

export const cloudWalletSchema = z.object({
  id: z.uuid(), name: z.string(), kind: z.enum(["personal", "shared"]),
  currency_code: z.literal("PEN"), owner_id: z.uuid(),
});
export type CloudWallet = z.infer<typeof cloudWalletSchema>;
const rowSchema = z.object({
  id: z.uuid(), type: z.enum(["income", "expense"]), amount_cents: z.number().int(),
  description: z.string(), category_id: z.string(), payment_method_id: z.string(),
  occurred_on: z.string(), created_at: z.string(), version: z.number().int().positive(),
});
function transactionFromRow(value: unknown): Transaction {
  const row = rowSchema.parse(value);
  return transactionSchema.parse({ id: row.id, type: row.type, amountCents: row.amount_cents,
    description: row.description, category: row.category_id, paymentMethod: row.payment_method_id,
    date: row.occurred_on, createdAt: row.created_at, version: row.version, isDemo: false });
}
export function databaseError(error: { code?: string; message: string }): Error {
  if (["PGRST202", "PGRST205", "42P01"].includes(error.code ?? "")) return new Error("Falta aplicar la migración de Wally en Supabase.");
  if (error.code === "23505") return new Error("Este registro ya existe. Actualiza la billetera antes de continuar.");
  if (error.code === "23503") return new Error("La categoría no pertenece a esta billetera o a este tipo de movimiento.");
  if (error.code === "42501") return new Error("No tienes acceso a esta operación. Revisa tu sesión y los permisos de la billetera.");
  if (error.code === "40001") return new Error("Otra persona modificó este movimiento. Cierra el detalle y vuelve a abrirlo para revisar la última versión.");
  if (error.code === "22023") return new Error(error.message);
  return new Error("No pudimos completar la operación en Supabase. Revisa tu conexión e inténtalo otra vez.");
}

export function createWalletRepository(client: SupabaseClient<Database>, walletId: string): WalletRepository {
  let current: WalletData | undefined;
  let revision = 0;
  return {
    async load() {
      const startedAt = revision;
      const { data, error } = await client.rpc("get_wallet", { p_wallet_id: walletId });
      if (error) throw databaseError(error);
      const snapshot = z.object({ wallet: cloudWalletSchema, categories: z.array(categoryDefinitionSchema), transactions: z.array(z.unknown()) }).parse(data);
      const parsed = walletSchema.parse({ version: 1, currency: snapshot.wallet.currency_code, demo: false,
        categories: snapshot.categories, transactions: snapshot.transactions.map(transactionFromRow) });
      if (startedAt === revision) current = parsed;
      return current ?? parsed;
    },
    async execute(command: WalletCommand) {
      if (!current) throw new Error("Espera a que termine de cargar la billetera.");
      revision++;
      if (command.type === "start-personal") return { data: current };
      if (command.type === "add-category") {
        const category = categoryDefinitionSchema.parse(command.category);
        const { data, error } = await client.from("categories").insert({ ...category, wallet_id: walletId }).select().single();
        if (error) throw databaseError(error);
        revision++;
        current = walletSchema.parse({ ...current, categories: [...current.categories, categoryDefinitionSchema.parse(data)] });
        return { data: current };
      }
      const item = command.type === "remove" ? { id: command.id } : command.transaction;
      const version = command.type === "remove" ? command.version : command.transaction.version;
      const { data, error } = await client.rpc("mutate_transaction", {
        p_wallet_id: walletId, p_action: command.type, p_transaction: item, p_expected_version: version,
      });
      if (error) throw databaseError(error);
      revision++;
      const result = z.object({ previous: z.unknown().nullable(), transaction: z.unknown().nullable() }).parse(data);
      const previous = result.previous ? transactionFromRow(result.previous) : undefined;
      const saved = result.transaction ? transactionFromRow(result.transaction) : undefined;
      current = walletSchema.parse({ ...current, transactions: [
        ...(saved ? [saved] : []), ...current.transactions.filter(t => t.id !== item.id),
      ] });
      // Undoing an edit must compare against the version just committed.
      return { data: current, previous: previous && saved ? { ...previous, version: saved.version } : previous };
    },
    subscribe() { return () => {}; },
  };
}

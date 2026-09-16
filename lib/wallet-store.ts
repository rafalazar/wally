import { createDemoWallet, decodeWallet, transactionSchema, walletSchema, type Category, type Transaction, type WalletData } from "./finance.ts";

// Legacy USD data stays untouched. A currency change is not a conversion.
export const LEGACY_STORAGE_KEY = "wally.wallet.v1";
export const STORAGE_KEY = "wally.wallet.pen.v1";

export type WalletCommand =
  | { type: "add" | "update" | "restore"; transaction: Transaction }
  | { type: "remove"; id: string; version?: number }
  | { type: "add-category"; category: Category }
  | { type: "start-personal" };

export type WalletResult = { data: WalletData; previous?: Transaction };
export interface WalletRepository {
  load(): Promise<WalletData>;
  execute(command: WalletCommand): Promise<WalletResult>;
  subscribe(onChange: () => void): () => void;
}

function write(data: WalletData): WalletData {
  const valid = walletSchema.parse(data);
  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(valid)); }
  catch { throw new Error("No se pudo guardar. Revisa el espacio o los permisos del navegador e inténtalo otra vez."); }
  return valid;
}

function read(): WalletData {
  let raw: string | null;
  try { raw = window.localStorage.getItem(STORAGE_KEY); }
  catch { throw new Error("No podemos acceder al almacenamiento de este navegador."); }
  // Only a truly absent key initializes the demo. Empty or corrupt values stay untouched.
  if (raw === null) return write(createDemoWallet());
  try { return decodeWallet(raw); }
  catch { throw new Error("No pudimos leer tus movimientos. Tus datos siguen intactos; revisa el almacenamiento del navegador."); }
}

function execute(command: WalletCommand): WalletResult {
  const current = read();
  if (command.type === "add-category") {
    return { data: write({ ...current, categories: [...current.categories, command.category] }) };
  }
  if (command.type === "start-personal") {
    return { data: write({ ...current, demo: false, transactions: current.transactions.filter(item => !item.isDemo) }) };
  }
  if (command.type === "remove") {
    const previous = current.transactions.find(item => item.id === command.id);
    if (!previous) throw new Error("Este movimiento ya no existe. Actualiza la lista para continuar.");
    return { data: write({ ...current, transactions: current.transactions.filter(item => item.id !== command.id) }), previous };
  }
  const transaction = transactionSchema.parse(command.transaction);
  const previous = current.transactions.find(item => item.id === transaction.id);
  if ((command.type === "add" || command.type === "restore") && previous) throw new Error("Este movimiento ya está registrado.");
  if (command.type === "update" && !previous) throw new Error("Este movimiento se eliminó desde otra pestaña.");
  return {
    data: write({ ...current, transactions: [transaction, ...current.transactions.filter(item => item.id !== transaction.id)] }),
    previous,
  };
}

export const walletRepository: WalletRepository = {
  async load() { return navigator.locks ? navigator.locks.request(STORAGE_KEY, read) : read(); },
  async execute(command) {
    if (navigator.locks) return navigator.locks.request(STORAGE_KEY, () => execute(command));
    return execute(command);
  },
  subscribe(onChange) {
    const listener = (event: StorageEvent) => {
      if (event.storageArea === window.localStorage && (event.key === STORAGE_KEY || event.key === null)) onChange();
    };
    window.addEventListener("storage", listener);
    return () => window.removeEventListener("storage", listener);
  },
};


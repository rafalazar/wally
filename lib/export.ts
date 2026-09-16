import { categories, localDate, transactionsToCsv, type Category, type Transaction } from "./finance";

export function downloadTransactions(transactions: Transaction[], catalog: readonly Category[] = categories) {
  const url = URL.createObjectURL(new Blob([transactionsToCsv(transactions, catalog)], { type: "text/csv;charset=utf-8;" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `wally-movimientos-${localDate()}.csv`;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

import { eachDayOfInterval, endOfMonth, format, parseISO, startOfMonth, subMonths } from "date-fns";
import { categories, localDate, type Category, type CategoryId, type Transaction, type TransactionType } from "./finance.ts";

export type HistoryFilters = {
  search: string;
  type: "all" | TransactionType;
  category: "all" | CategoryId;
  month: string;
  sort: "date" | "amount";
};
export const defaultFilters: HistoryFilters = { search: "", type: "all", category: "all", month: "", sort: "date" };
const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export function filterTransactions(transactions: Transaction[], filters: HistoryFilters, catalog: readonly Category[] = categories) {
  const search = normalize(filters.search.trim());
  return transactions.filter(item =>
    (filters.type === "all" || item.type === filters.type) &&
    (filters.category === "all" || item.category === filters.category) &&
    (!filters.month || item.date.startsWith(filters.month)) &&
    normalize(`${item.description} ${catalog.find(category => category.id === item.category)?.label ?? ""}`).includes(search),
  ).sort((a, b) => filters.sort === "amount"
    ? b.amountCents - a.amountCents || b.date.localeCompare(a.date)
    : b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
}

export function availableMonths(transactions: Transaction[], today = localDate()) {
  const date = parseISO(today);
  const months = Array.from({ length: 12 }, (_, index) => format(subMonths(date, index), "yyyy-MM"));
  return [...new Set([...months, ...transactions.map(item => item.date.slice(0, 7))])].filter(month => month <= today.slice(0, 7)).sort().reverse();
}

export function buildMonthlyInsights(transactions: Transaction[], month: string, today = localDate(), catalog: readonly Category[] = categories) {
  const items = transactions.filter(item => item.date.startsWith(month) && item.date <= today);
  const income = items.filter(item => item.type === "income").reduce((sum, item) => sum + item.amountCents, 0);
  const expense = items.filter(item => item.type === "expense").reduce((sum, item) => sum + item.amountCents, 0);
  const breakdown = catalog.filter(category => category.type === "expense").map(category => ({
    ...category,
    amount: items.filter(item => item.category === category.id).reduce((sum, item) => sum + item.amountCents, 0),
  })).filter(category => category.amount > 0).sort((a, b) => b.amount - a.amount);
  const start = startOfMonth(parseISO(`${month}-01`));
  const end = month === today.slice(0, 7) ? parseISO(today) : endOfMonth(start);
  const daily = eachDayOfInterval({ start, end }).map(day => {
    const date = localDate(day);
    const dayItems = items.filter(item => item.date === date);
    return {
      date,
      day: format(day, "d"),
      income: dayItems.filter(item => item.type === "income").reduce((sum, item) => sum + item.amountCents, 0),
      expense: dayItems.filter(item => item.type === "expense").reduce((sum, item) => sum + item.amountCents, 0),
    };
  });
  return { items, income, expense, balance: income - expense, breakdown, daily };
}


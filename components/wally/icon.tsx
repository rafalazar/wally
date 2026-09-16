import type { CSSProperties } from "react";
import {
  Wallet, CreditCard, ArrowUp, ArrowDown, TrendingUp, Bell, ChevronRight,
  ChevronDown, SquarePen, Plus, Check, X, Search, Download, ShieldCheck,
  Heart, Trash2, Info, Sparkles, ArrowRight, ChartNoAxesCombined,
  ListFilter, LoaderCircle, CalendarDays, RotateCcw, CircleHelp, CheckCheck,
} from "lucide-react";

const icons = {
  wallet: Wallet, card: CreditCard, up: ArrowUp, down: ArrowDown,
  trend: TrendingUp, bell: Bell, chevron: ChevronRight, chevronDown: ChevronDown,
  edit: SquarePen, plus: Plus, check: Check, close: X, search: Search,
  download: Download, shield: ShieldCheck, heart: Heart, trash: Trash2,
  info: Info, sparkle: Sparkles, arrow: ArrowRight, chart: ChartNoAxesCombined,
  filter: ListFilter, loader: LoaderCircle, calendar: CalendarDays,
  undo: RotateCcw, help: CircleHelp, saved: CheckCheck,
};
export type IconName = keyof typeof icons;
export function Icon({ name, size = 20, className, style }: {
  name: IconName; size?: number; className?: string; style?: CSSProperties;
}) {
  const Component = icons[name];
  return <Component size={size} strokeWidth={1.75} aria-hidden="true" className={className} style={style} />;
}

"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { formatMoney } from "@/lib/finance";
import { Icon, type IconName } from "./icon";
import { useUi, useWorkspace, type View } from "./wally-provider";

type Props = {
  balance?: number;
  onHelp: () => void; onPrivacy: () => void; onExport: () => void;
};
const pages: { view: View; label: string; icon: IconName }[] = [
  { view: "register", label: "Registro", icon: "plus" },
  { view: "history", label: "Movimientos", icon: "wallet" },
  { view: "insights", label: "Resumen", icon: "chart" },
];

export function Header({ balance, onHelp, onPrivacy, onExport }: Props) {
  const { displayName, signOut } = useWorkspace();
  const [signingOut, setSigningOut] = useState(false);
  const view = useUi(state => state.view);
  const navigate = useUi(state => state.navigate);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!accountOpen) return;
    function outside(event: PointerEvent) {
      if (!accountRef.current?.contains(event.target as Node)) setAccountOpen(false);
    }
    function escape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setAccountOpen(false);
        accountRef.current?.querySelector<HTMLButtonElement>(".account-button")?.focus();
      }
    }
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [accountOpen]);
  function go(next: View) {
    navigate(next);
    setAccountOpen(false);
    window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  }
  function action(callback: () => void) { setAccountOpen(false); callback(); }

  return <header className="site-header"><div className="header-inner">
    <button className="brand" onClick={() => go("register")} aria-label="Wally, ir al registro">
      <span className="brand-mark"><Icon name="wallet" size={23} /></span>
      <span className="brand-copy"><span className="brand-name">Wally <span className="beta-badge">Beta</span></span>
        <span className="brand-tagline">Un poco de orden. Mucha tranquilidad.</span>
      </span>
    </button>
    <nav className="main-nav" aria-label="Navegación principal">
      {pages.map(page => <button key={page.view} onClick={() => go(page.view)}
        aria-current={view === page.view ? "page" : undefined} className={view === page.view ? "active" : ""}>
        {view === page.view && <motion.span className="nav-active" layoutId="main-navigation" />}
        <span><Icon name={page.icon} size={17} />{page.label}</span>
      </button>)}
    </nav>
    <div className="header-actions">
      <div className="balance-pill"><span className="status-dot" /><strong>{balance === undefined ? "—" : formatMoney(balance)}</strong></div>
      <button className="icon-button header-help" aria-label="Ayuda de Wally" onClick={onHelp}><Icon name="help" size={21} /></button>
      <div className="account-anchor popover-anchor" ref={accountRef}
        onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setAccountOpen(false); }}>
        <button type="button" className="account-button" aria-label="Mi espacio, opciones de cuenta"
          aria-expanded={accountOpen} aria-controls="account-panel" onClick={() => setAccountOpen(!accountOpen)}>
          <span className="avatar">W</span>
          <span className="account-copy"><strong>{displayName}</strong><span>Cuenta de Google</span></span>
          <Icon name="chevronDown" size={15} />
        </button>
        <AnimatePresence>{accountOpen && <motion.div className="header-popover account-popover" id="account-panel"
          initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
          <div className="popover-profile"><span className="avatar large">W</span><div><strong>Tu espacio personal</strong><p>Un día a la vez, con Wally.</p></div></div>
          <div className="account-sync-info"><span className="status-dot" />Guardado en tu cuenta</div>
          <button className="popover-action" onClick={() => go("history")}><Icon name="wallet" size={17} />Mis movimientos<Icon name="chevron" size={14} /></button>
          <button className="popover-action" onClick={() => action(onExport)}><Icon name="download" size={17} />Exportar mis datos<Icon name="chevron" size={14} /></button>
          <button className="popover-action" onClick={() => action(onPrivacy)}><Icon name="shield" size={17} />Privacidad<Icon name="chevron" size={14} /></button>
          <button className="popover-action" disabled={signingOut} onClick={() => {
            setSigningOut(true);
            void signOut().catch(cause => toast.error(cause.message)).finally(() => setSigningOut(false));
          }}><Icon name="arrow" size={17} />{signingOut ? "Cerrando sesión..." : "Cerrar sesión"}</button>
        </motion.div>}</AnimatePresence>
      </div>
    </div>
  </div></header>;
}

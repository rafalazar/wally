"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { motion } from "motion/react";
import { Icon } from "./icon";

export function Modal({ title, children, onClose, wide = false }: {
  title: string; children: ReactNode; onClose: () => void; wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current!;
    const focused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const oldOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.body.style.overflow = oldOverflow;
      if (focused?.isConnected) focused.focus({ preventScroll: true });
    };
  }, []);
  return <motion.dialog ref={ref} className={`modal ${wide ? "modal-wide" : ""}`} aria-labelledby={titleId}
    initial={{ opacity: 0, y: 16, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: 8, scale: 0.98 }}
    onCancel={event => { event.preventDefault(); onClose(); }}
    onClick={event => {
      if (event.target !== event.currentTarget) return;
      const rect = event.currentTarget.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onClose();
    }}>
    <div className="modal-header">
      <h2 id={titleId}>{title}</h2>
      <button type="button" className="icon-button" onClick={onClose} aria-label="Cerrar ventana"><Icon name="close" /></button>
    </div>
    <div className="modal-body">{children}</div>
  </motion.dialog>;
}

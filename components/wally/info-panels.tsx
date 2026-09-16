"use client";

import { useState } from "react";
import { Icon } from "./icon";
import { useWorkspace } from "./wally-provider";

export function PersonalPanel({ exampleCount, onConfirm, onClose }: {
  exampleCount: number; onConfirm: () => Promise<void>; onClose: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function start() {
    setBusy(true);
    try { await onConfirm(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "No pudimos preparar tu espacio."); }
    finally { setBusy(false); }
  }
  return <>
    <div className="welcome-illustration"><span className="brand-mark"><Icon name="wallet" size={32} /></span><span className="welcome-sparkle"><Icon name="sparkle" size={22} /></span></div>
    <p className="modal-intro">Los ejemplos te ayudan a conocer Wally. Ahora, deja que tus propias cuentas cuenten la historia.</p>
    <div className="info-box"><Icon name="info" size={18} /><p>Se eliminarán {exampleCount} movimientos de ejemplo. <strong>Los movimientos que tú hayas registrado se conservarán.</strong></p></div>
    {error && <div className="inline-error" role="alert">{error}</div>}
    <button className="primary-button full-width" disabled={busy} onClick={start}>{busy ? "Preparando tu espacio..." : "Empezar con mis datos"}<Icon name={busy ? "loader" : "arrow"} className={busy ? "spin" : undefined} size={18} /></button>
    <button className="text-button centered-button" disabled={busy} onClick={onClose}>Seguir explorando</button>
  </>;
}

export function HelpPanel() {
  return <>
    <p className="modal-intro">Llevar tus cuentas puede ser así de sencillo.</p>
    <ol className="help-steps">
      <li><span>1</span><div><h3>Elige ingreso o gasto</h3><p>Escribe el monto en soles. Usa los botones para sumar o ingresa un importe con punto o coma decimal.</p></div></li>
      <li><span>2</span><div><h3>Dale un poco de contexto</h3><p>Añade un detalle, la categoría, el método y la fecha. Wally recuerda las opciones de tu último registro.</p></div></li>
      <li><span>3</span><div><h3>Registra y sigue con tu día</h3><p>Tu saldo se actualiza al guardar. Puedes deshacer desde la confirmación y editar o eliminar un movimiento desde su detalle.</p></div></li>
    </ol>
    <div className="info-box"><Icon name="chart" size={19} /><p>En Movimientos puedes buscar, filtrar y exportar a CSV. En Resumen encontrarás tus gráficas por mes.</p></div>
    <p className="small-print">Los pagos con crédito se registran como gastos en su fecha. Wally todavía no administra deudas ni ciclos de tarjeta.</p>
  </>;
}

export function PrivacyPanel({ onExport }: { onExport: () => void }) {
  const { cloud } = useWorkspace();
  if (cloud) return <>
    <span className="privacy-icon"><Icon name="shield" size={30} /></span>
    <p className="modal-intro">Tus movimientos se guardan en Supabase y están vinculados con tu billetera.</p>
    <div className="privacy-points">
      <h3>Tu billetera personal es privada</h3><p>Solo tu usuario tiene acceso. En las billeteras compartidas, todos los miembros pueden ver, registrar, editar y eliminar movimientos.</p>
      <h3>Disponible desde tus dispositivos</h3><p>Inicia sesión con Google para acceder. Necesitas conexión para guardar; las billeteras se actualizan periódicamente y al volver a la aplicación.</p>
      <h3>Tú gestionas el acceso</h3><p>El propietario puede invitar o retirar miembros. Puedes exportar los movimientos a CSV y cerrar sesión en este dispositivo.</p>
    </div>
    <button className="secondary-button full-width" onClick={onExport}><Icon name="download" size={17} />Descargar mis movimientos</button>
  </>;
  return <>
    <span className="privacy-icon"><Icon name="shield" size={30} /></span>
    <p className="modal-intro">Tus movimientos se guardan en el almacenamiento local de este navegador.</p>
    <div className="privacy-points">
      <h3>Siempre a mano en este navegador</h3><p>Los registros permanecen al recargar. Todavía no hay inicio de sesión, sincronización entre dispositivos ni respaldo en la nube.</p>
      <h3>Tú decides qué conservar</h3><p>Puedes editar o eliminar movimientos desde su detalle y descargar una copia en CSV. Borrar los datos del navegador también elimina los registros de Wally.</p>
      <h3>Un espacio personal</h3><p>Wally no cifra el almacenamiento local. Las personas con acceso a este perfil del navegador pueden ver los movimientos.</p>
    </div>
    <button className="secondary-button full-width" onClick={onExport}><Icon name="download" size={17} />Descargar mis movimientos</button>
  </>;
}

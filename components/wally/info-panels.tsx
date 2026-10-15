"use client";

import { Icon } from "./icon";

export function HelpPanel() {
  return <>
    <p className="modal-intro">Llevar tus cuentas puede ser así de sencillo.</p>
    <ol className="help-steps">
      <li><span>1</span><div><h3>Elige ingreso o gasto</h3><p>Escribe el monto en soles. Usa los botones para sumar o ingresa un importe con punto o coma decimal.</p></div></li>
      <li><span>2</span><div><h3>Dale un poco de contexto</h3><p>Elige la categoría, el método y la fecha. Si quieres, añade una nota en el detalle. Wally recuerda las opciones de tu último registro.</p></div></li>
      <li><span>3</span><div><h3>Registra y sigue con tu día</h3><p>Tu saldo se actualiza al guardar. Puedes deshacer desde la confirmación y editar o eliminar un movimiento desde su detalle.</p></div></li>
    </ol>
    <div className="info-box"><Icon name="chart" size={19} /><p>En Movimientos puedes buscar, filtrar y exportar a CSV. En Resumen encontrarás tus gráficas por mes.</p></div>
    <p className="small-print">Los pagos con crédito se registran como gastos en su fecha. Wally todavía no administra deudas ni ciclos de tarjeta.</p>
  </>;
}

export function PrivacyPanel({ onExport }: { onExport: () => void }) {
  return <>
    <span className="privacy-icon"><Icon name="shield" size={30} /></span>
    <p className="modal-intro">Tus movimientos se guardan en tu cuenta de Wally y están vinculados con tu billetera.</p>
    <div className="privacy-points">
      <h3>Tu billetera personal es privada</h3><p>Solo tu usuario tiene acceso. En las billeteras compartidas, todos los miembros pueden ver, registrar, editar y eliminar movimientos.</p>
      <h3>Disponible desde tus dispositivos</h3><p>Inicia sesión con Google para acceder. Necesitas conexión para guardar; las billeteras se actualizan periódicamente y al volver a la aplicación.</p>
      <h3>Tú gestionas el acceso</h3><p>El propietario puede invitar o retirar miembros. Puedes exportar los movimientos a CSV y cerrar sesión en este dispositivo.</p>
    </div>
    <button className="secondary-button full-width" onClick={onExport}><Icon name="download" size={17} />Descargar mis movimientos</button>
  </>;
}

"use client";

import { useState } from "react";
import { ArrowDown, ArrowRight, ArrowUpRight, Check, Coffee, Minus, Plus, RotateCcw, ShoppingBasket } from "lucide-react";
import { BrandMark } from "./brand-mark";

const exampleAmount = (value: number) => `S/ ${new Intl.NumberFormat("es-PE").format(value)}`;

export function LandingPage({ onAccess }: { onAccess: () => void }) {
  const [coffees, setCoffees] = useState(1);
  const coffeeExpense = coffees * 12;
  const balance = 1500 - coffeeExpense - 85;

  return (
    <div className="landing-page">
      <a className="skip-link" href="#landing-main">Ir al contenido</a>
      <header className="landing-header">
        <a className="brand" href="#landing-main" aria-label="Wally, inicio">
          <BrandMark /><span className="brand-name">wally</span>
        </a>
        <nav aria-label="Navegación principal">
          <a className="landing-nav-link" href="#como-funciona">Cómo funciona</a>
          <button className="landing-access" onClick={onAccess}>Acceder <ArrowUpRight size={18} aria-hidden="true" /></button>
        </nav>
      </header>

      <main id="landing-main">
        <section className="landing-hero landing-width" aria-labelledby="landing-title">
          <div className="landing-hero-copy">
            <h1 id="landing-title" tabIndex={-1}>Tu dinero,<br /><span>sin vueltas.</span></h1>
            <div className="landing-start">
              <button className="landing-primary" onClick={onAccess}>Empezar con Wally <ArrowRight size={21} aria-hidden="true" /></button>
              <span>Con tu cuenta de Google.</span>
            </div>
          </div>
          <div className="landing-hero-aside">
            <p>El cafecito. Las compras.<br />Eso que no sabes en qué se fue.</p>
            <p>Registra tus ingresos y gastos en soles, entiende tus cuentas y sigue con tu día.</p>
            <a href="#tu-dia">Así de simple <ArrowDown size={18} aria-hidden="true" /></a>
          </div>
        </section>

        <section className="landing-example" id="tu-dia" aria-labelledby="example-title">
          <div className="landing-width">
            <div className="landing-example-heading">
              <h2 id="example-title">Un poco de orden.<br className="landing-mobile-break" /> Y todo empieza a cuadrar.</h2>
              <p>Un ejemplo en soles. No se guarda.</p>
            </div>
            <div className="landing-equation" aria-label="Ejemplo de ingresos menos gastos igual a saldo">
              <div className="landing-term landing-income">
                <span className="landing-term-label"><Plus size={20} aria-hidden="true" />Tu ingreso</span>
                <strong>{exampleAmount(1500)}</strong>
                <span>Un buen comienzo.</span>
              </div>
              <Minus className="landing-math" size={22} aria-hidden="true" />
              <div className="landing-term landing-expense">
                <span className="landing-term-label"><Coffee size={20} aria-hidden="true" />{coffees === 1 ? "El cafecito" : "Los cafecitos"}</span>
                <strong>{exampleAmount(coffeeExpense)}</strong>
                <span>{coffees === 1 ? "Porque sí, también cuenta." : `${coffees} cafés de S/ 12.`}</span>
              </div>
              <Minus className="landing-math" size={22} aria-hidden="true" />
              <div className="landing-term landing-expense">
                <span className="landing-term-label"><ShoppingBasket size={20} aria-hidden="true" />Las compras</span>
                <strong>{exampleAmount(85)}</strong>
                <span>Lo de todos los días.</span>
              </div>
              <span className="landing-equals" aria-hidden="true">=</span>
              <div className="landing-term landing-result">
                <span className="landing-term-label"><Check size={20} aria-hidden="true" />Tu saldo</span>
                <strong key={balance} className="landing-balance">{exampleAmount(balance)}</strong>
                <span>Ahora sabes dónde estás.</span>
              </div>
            </div>
            <div className="landing-example-actions">
              <p>Los pequeños gastos también tienen su lugar.</p>
              <div>
                <button className="landing-coffee" onClick={() => setCoffees(value => value + 1)} disabled={coffees >= 5}>
                  <Plus size={17} aria-hidden="true" />{coffees >= 5 ? "Cinco cafés por hoy" : "Otro café de S/ 12"}
                </button>
                {coffees > 1 && <button className="landing-reset" onClick={() => setCoffees(1)} aria-label="Reiniciar ejemplo"><RotateCcw size={18} aria-hidden="true" /></button>}
              </div>
            </div>
            <p className="sr-only" role="status">{coffees > 1 ? `Ejemplo actualizado: ${coffees} cafés, gasto ${exampleAmount(coffeeExpense)}. Saldo ${exampleAmount(balance)}.` : "Ejemplo inicial: ingreso S/ 1,500, café S/ 12, compras S/ 85. Saldo S/ 1,403."}</p>
          </div>
        </section>

        <section className="landing-how landing-width" id="como-funciona" aria-labelledby="how-title">
          <div className="landing-section-intro">
            <h2 id="how-title">Menos cuentas<br />en la cabeza.</h2>
            <p>Un lugar para lo que entra, lo que sale y lo que quieres tener claro.</p>
          </div>
          <div className="landing-features">
            <article>
              <h3>Lo registras.</h3>
              <p>Ingreso o gasto, monto y categoría. Añade una nota si la necesitas. Tú registras los movimientos; Wally hace las cuentas.</p>
              <span className="landing-feature-note">En soles, como tu día a día.</span>
            </article>
            <article>
              <h3>Lo encuentras.</h3>
              <p>Busca ese gasto, filtra tus movimientos y corrige lo que haga falta. Tu historial está para ayudarte a recordar.</p>
              <span className="landing-feature-note">También puedes exportarlo a CSV.</span>
            </article>
            <article>
              <h3>Lo ves claro.</h3>
              <p>Revisa tus ingresos y gastos del mes, y cómo se distribuyen por categoría. El resumen sale de lo que registraste.</p>
              <span className="landing-feature-note">Cada cifra tiene una historia detrás.</span>
            </article>
          </div>
        </section>

        <section className="landing-sharing" aria-labelledby="sharing-title">
          <div className="landing-width landing-sharing-inner">
            <h2 id="sharing-title">Tus cuentas.<br /><span>O las de ustedes.</span></h2>
            <div>
              <p>Tu billetera personal es solo tuya. Y si compartes gastos, crea otra billetera e invita a tu pareja, familia o equipo.</p>
              <p className="landing-sharing-detail">En una billetera compartida, sus miembros pueden ver, registrar y editar los movimientos.</p>
              <button className="landing-text-action" onClick={onAccess}>Empieza por la tuya <ArrowUpRight size={20} aria-hidden="true" /></button>
            </div>
          </div>
        </section>

        <section className="landing-questions landing-width" id="tus-datos" aria-labelledby="questions-title">
          <h2 id="questions-title">Claro desde<br />el principio.</h2>
          <div className="landing-faq-list">
            <details>
              <summary>¿Necesito conectar mi banco?<Plus size={19} aria-hidden="true" /></summary>
              <p>No. Registras tus ingresos y gastos manualmente. Wally no se conecta a tu banco ni administra deudas, cuotas o ciclos de tarjeta.</p>
            </details>
            <details>
              <summary>¿Quién puede ver mis movimientos?<Plus size={19} aria-hidden="true" /></summary>
              <p>Tu billetera personal es privada. Si creas una compartida, sus miembros pueden ver, registrar, editar y eliminar sus movimientos. El propietario gestiona quién tiene acceso.</p>
            </details>
            <details>
              <summary>¿Puedo usar Wally en otro dispositivo?<Plus size={19} aria-hidden="true" /></summary>
              <p>Sí. Inicia sesión con la misma cuenta de Google para acceder a tus billeteras. Necesitas conexión a internet para guardar; los datos se actualizan periódicamente y al volver a la app.</p>
            </details>
            <details>
              <summary>¿Cómo empiezo?<Plus size={19} aria-hidden="true" /></summary>
              <p>Accede con Google. Si tu cuenta es nueva, registra un saldo inicial positivo en soles. Después puedes añadir tus ingresos y gastos, revisar tu historial y consultar el resumen mensual.</p>
            </details>
          </div>
        </section>

        <section className="landing-close" aria-labelledby="close-title">
          <div className="landing-width">
            <h2 id="close-title">Tu día ya tiene<br />suficientes vueltas.</h2>
            <div>
              <p>Dale un poco de orden a tus cuentas.</p>
              <button className="landing-primary" onClick={onAccess}>Empezar con Wally <ArrowRight size={21} aria-hidden="true" /></button>
            </div>
          </div>
        </section>
      </main>

      <footer className="landing-footer landing-width">
        <a className="brand" href="#landing-main" aria-label="Wally, volver al inicio"><BrandMark /><span className="brand-name">wally</span></a>
        <p>Un poco de orden. Mucha tranquilidad.</p>
        <nav aria-label="Enlaces del pie de página"><a href="#como-funciona">Cómo funciona</a><a href="#tus-datos">Tus datos</a></nav>
      </footer>
    </div>
  );
}

"use client";

import { useId, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { subDays } from "date-fns";
import {
  localDate, MAX_AMOUNT_CENTS, parseAmount, paymentMethods,
  createTransactionFormSchema, type Transaction, type TransactionFormValues, type TransactionType,
} from "@/lib/finance";
import { useCategories, useUi, useWallet, useWorkspace } from "./wally-provider";
import { Icon } from "./icon";

type Props = {
  ready: boolean;
  initial?: Transaction;
  onSave: (transaction: Transaction) => Promise<void>;
  onCancel?: () => void;
};

export function TransactionForm({ ready, initial, onSave, onCancel }: Props) {
  const categories = useCategories();
  const wallet = useWallet();
  const { cloud } = useWorkspace();
  const id = useId();
  const preferences = useUi(state => state.preferences);
  const remember = useUi(state => state.remember);
  const [saved, setSaved] = useState(false);
  const [draftId, setDraftId] = useState(() => crypto.randomUUID());
  const [baseVersion] = useState(initial?.version);
  const [categoryName, setCategoryName] = useState("");
  const [addingCategory, setAddingCategory] = useState(false);
  const [categoryBusy, setCategoryBusy] = useState(false);
  const [categoryError, setCategoryError] = useState("");
  const choiceFor = (type: TransactionType) => categories.find(c => c.id === preferences[type].category && c.type === type)?.id
    ?? categories.find(c => c.type === type)!.id;
  const {
    register, control, handleSubmit, setValue, setFocus, reset, clearErrors, setError,
    formState: { errors, isSubmitting },
  } = useForm<TransactionFormValues>({
    resolver: zodResolver(createTransactionFormSchema(categories)),
    defaultValues: {
      type: initial?.type ?? "expense",
      amount: initial ? (initial.amountCents / 100).toFixed(2) : "",
      description: initial?.description ?? "",
      category: initial?.category ?? choiceFor("expense"),
      paymentMethod: initial?.paymentMethod ?? preferences.expense.paymentMethod,
      date: initial?.date ?? localDate(),
    },
    mode: "onTouched",
  });
  const values = useWatch({ control });
  const type = values.type ?? "expense";
  const isIncome = type === "income";
  const amount = values.amount ?? "";
  const amountField = register("amount");

  function changeType(next: TransactionType) {
    setValue("type", next);
    setValue("category", choiceFor(next));
    setValue("paymentMethod", preferences[next].paymentMethod);
    clearErrors(["category", "paymentMethod"]);
    setAddingCategory(false); setCategoryError("");
    setSaved(false);
  }

  function addAmount(value: number) {
    const current = parseAmount(amount) ?? 0;
    setValue("amount", (Math.min(current + value * 100, MAX_AMOUNT_CENTS) / 100).toFixed(2), {
      shouldValidate: true, shouldDirty: true,
    });
    setSaved(false);
  }

  async function submit(data: TransactionFormValues) {
    if (!ready) return;
    clearErrors("root");
    try {
      await onSave({
        id: initial?.id ?? draftId,
        type: data.type,
        amountCents: parseAmount(data.amount)!,
        description: data.description,
        category: data.category,
        paymentMethod: data.paymentMethod,
        date: data.date,
        createdAt: initial?.createdAt ?? new Date().toISOString(),
        isDemo: initial?.isDemo ?? false,
        version: baseVersion,
      });
      remember(data.type, { category: data.category, paymentMethod: data.paymentMethod });
      if (!initial) {
        setDraftId(crypto.randomUUID());
        reset({ ...data, amount: "", description: "", date: localDate() });
        setSaved(true);
        requestAnimationFrame(() => setFocus("amount"));
      }
    } catch (error) {
      setError("root", { message: error instanceof Error ? error.message : "No pudimos guardar el movimiento. Inténtalo otra vez." });
    }
  }

  return <section className={initial ? "edit-record" : "quick-record"} aria-labelledby={initial ? undefined : `${id}-title`}>
    {!initial && <div className="section-heading centered">
      <span className="section-kicker"><span />UN PEQUEÑO HÁBITO, UNA GRAN DIFERENCIA</span>
      <h1 id={`${id}-title`}>Tus cuentas, al día.</h1>
      <p>Registra un movimiento y sigue con lo que importa.</p>
    </div>}
    <form className={`record-card ${isIncome ? "is-income" : "is-expense"} ${initial ? "record-card-embedded" : ""}`}
      onSubmit={handleSubmit(submit)} onChange={() => setSaved(false)} noValidate>
      <fieldset disabled={!ready || isSubmitting || categoryBusy} className="record-fieldset">
        <LayoutGroup id={id}>
          <fieldset className="type-switch" aria-label="Tipo de transacción">
            {(["expense", "income"] as const).map(value => <label key={value}
              className={`switch-option ${type === value ? "selected" : ""}`}>
              {type === value && <motion.span className="switch-slider" layoutId="active-type" transition={{ type: "spring", stiffness: 420, damping: 32 }} />}
              <input type="radio" {...register("type")} value={value} checked={type === value} onChange={() => changeType(value)} />
              <span className="switch-text"><Icon name={value === "expense" ? "down" : "up"} size={18} />{value === "expense" ? "Gasto" : "Ingreso"}</span>
            </label>)}
          </fieldset>
        </LayoutGroup>

        <div className="amount-section">
          <label className="amount-label" htmlFor={`${id}-amount`}>Monto de la operación <span className="currency-badge">PEN</span></label>
          <div className={`amount-entry ${errors.amount ? "has-error" : ""}`}>
            <span className="currency-symbol" aria-hidden="true">S/</span>
            <input {...amountField} id={`${id}-amount`} data-amount type="text" inputMode="decimal"
              autoComplete="off" placeholder="0.00" maxLength={12} aria-label="Monto en soles"
              aria-invalid={!!errors.amount} aria-describedby={errors.amount ? `${id}-amount-error` : undefined}
              className={amount.length > 7 ? "long-amount" : ""}
              onBlur={event => {
                void amountField.onBlur(event);
                const cents = parseAmount(event.target.value);
                if (cents) setValue("amount", (cents / 100).toFixed(2));
              }} />
          </div>
          <div className="quick-amounts"><span>Sumar:</span>
            {[10, 50, 100, 500].map(value => <motion.button whileTap={{ scale: 0.94 }} key={value}
              type="button" onClick={() => addAmount(value)} aria-label={`Sumar ${value} soles`}>+{value}</motion.button>)}
          </div>
          {errors.amount && <p className="field-error amount-error" id={`${id}-amount-error`} role="alert">{errors.amount.message}</p>}
        </div>

        <div className="form-fields">
          <div className="field">
            <label htmlFor={`${id}-description`} className="detail-label">Detalle del {isIncome ? "ingreso" : "gasto"}</label>
            <div className={`input-with-icon ${errors.description ? "has-error" : ""}`}>
              <Icon name="edit" size={17} />
              <input {...register("description")} id={`${id}-description`} type="text" maxLength={160}
                placeholder={isIncome ? "Ej. Sueldo, proyecto freelance..." : "Ej. Café, almuerzo, supermercado..."}
                aria-invalid={!!errors.description} aria-describedby={errors.description ? `${id}-description-error` : undefined} />
            </div>
            {errors.description && <p className="field-error" id={`${id}-description-error`} role="alert">{errors.description.message}</p>}
          </div>

          <fieldset className="field">
            <legend>Categoría</legend>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={type} className="category-options" initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}>
                {categories.filter(item => item.type === type).map(item => <label key={item.id}
                  className={`category-chip ${values.category === item.id ? "selected" : ""}`}>
                  <input type="radio" {...register("category")} value={item.id} />
                  <span aria-hidden="true">{item.emoji}</span>{item.label}
                </label>)}
              </motion.div>
            </AnimatePresence>
            {errors.category && <p className="field-error" role="alert">{errors.category.message}</p>}
            {!addingCategory ? <button className="text-button add-category-button" type="button" onClick={() => setAddingCategory(true)}><Icon name="plus" size={15} />Crear categoría</button>
              : <div className="new-category">
                <label htmlFor={`${id}-category-name`}>Nueva categoría de {isIncome ? "ingreso" : "gasto"}</label>
                <div className="inline-fields"><input id={`${id}-category-name`} value={categoryName} maxLength={40} disabled={categoryBusy}
                  onChange={event => setCategoryName(event.target.value)} placeholder="Ej. Mascotas" />
                  <button className="secondary-button" type="button" disabled={categoryBusy || !categoryName.trim()} onClick={() => {
                    setCategoryBusy(true); setCategoryError("");
                    const category = { id: crypto.randomUUID(), label: categoryName.trim(), type, emoji: "🏷️", tone: "green" as const, color: "#79bea8" };
                    void wallet.execute({ type: "add-category", category }).then(() => {
                      setValue("category", category.id); setCategoryName(""); setAddingCategory(false);
                    }).catch(cause => setCategoryError(cause.message)).finally(() => setCategoryBusy(false));
                  }}>{categoryBusy ? "Guardando..." : "Añadir"}</button>
                </div><button className="text-button" type="button" disabled={categoryBusy} onClick={() => setAddingCategory(false)}>Cancelar</button>
                {categoryError && <p className="field-error" role="alert">{categoryError}</p>}
              </div>}
          </fieldset>

          <fieldset className="field payment-field">
            <legend>{isIncome ? "¿Cómo lo recibiste?" : "Método de pago"}</legend>
            <div className="payment-options">
              {paymentMethods.filter(item => !isIncome || ["cash", "transfer"].includes(item.id)).map(item => <label
                className={`payment-option ${values.paymentMethod === item.id ? "selected" : ""}`} key={item.id}>
                <input type="radio" {...register("paymentMethod")} value={item.id} />
                <span aria-hidden="true">{item.emoji}</span>{item.label}
              </label>)}
            </div>
            {errors.paymentMethod && <p className="field-error" role="alert">{errors.paymentMethod.message}</p>}
          </fieldset>

          <div className="field date-field">
            <div className="field-label-row"><label htmlFor={`${id}-date`}>Fecha</label>
              <div className="date-shortcuts">
                {[{ label: "Hoy", date: localDate() }, { label: "Ayer", date: localDate(subDays(new Date(), 1)) }].map(item =>
                  <button key={item.label} type="button" aria-pressed={values.date === item.date}
                    onClick={() => setValue("date", item.date, { shouldValidate: true, shouldDirty: true })}>{item.label}</button>)}
              </div>
            </div>
            <input {...register("date")} id={`${id}-date`} type="date" min="1900-01-01" max={localDate()}
              aria-invalid={!!errors.date} aria-describedby={errors.date ? `${id}-date-error` : undefined} />
            {errors.date && <p className="field-error" id={`${id}-date-error`} role="alert">{errors.date.message}</p>}
          </div>

          {errors.root && <div className="inline-error" role="alert"><Icon name="info" size={18} />{errors.root.message}</div>}
          <motion.button whileTap={{ scale: 0.985 }} className="submit-button" type="submit"
            disabled={!ready || isSubmitting} aria-busy={isSubmitting}>
            <Icon name={isSubmitting ? "loader" : saved ? "check" : initial ? "saved" : "plus"}
              className={isSubmitting ? "spin" : undefined} size={21} />
            <span>{isSubmitting ? "Guardando..." : initial ? "Guardar cambios" : saved ? "¡Listo! Registra otro movimiento" : `Registrar ${isIncome ? "ingreso" : "gasto"}`}</span>
          </motion.button>
          {onCancel && <button type="button" className="text-button centered-button" onClick={onCancel}>Cancelar edición</button>}
        </div>
      </fieldset>
    </form>
    {!initial && <p className="save-reassurance"><Icon name="shield" size={14} />{cloud ? "Tus movimientos se guardan en tu billetera de Wally." : "Tus movimientos se guardan en este navegador."}</p>}
  </section>;
}


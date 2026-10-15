"use client";

import { useId } from "react";
import { useController, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { initialBalanceEditSchema, localDate, parseAmount, type Transaction } from "@/lib/finance";
import { AmountInput } from "./amount-input";
import { Icon } from "./icon";

export function InitialBalanceEdit({ initial, onSave, onCancel }: {
  initial: Transaction; onSave: (item: Transaction) => Promise<void>; onCancel: () => void;
}) {
  const id = useId();
  const { register, control, handleSubmit, setError, clearErrors, formState: { errors, isSubmitting } } = useForm<z.infer<typeof initialBalanceEditSchema>>({
    resolver: zodResolver(initialBalanceEditSchema),
    defaultValues: { amount: (initial.amountCents / 100).toFixed(2), description: initial.description, date: initial.date },
    mode: "onTouched",
  });
  const { field } = useController({ name: "amount", control });
  return <form className="initial-balance-edit" noValidate onSubmit={handleSubmit(async values => {
    clearErrors("root");
    try { await onSave({ ...initial, amountCents: parseAmount(values.amount)!, description: values.description, date: values.date }); }
    catch (cause) { setError("root", { message: cause instanceof Error ? cause.message : "No pudimos guardar el cambio. Inténtalo otra vez." }); }
  })}>
    <p className="modal-intro">Corrige tu saldo inicial. Seguirá registrado como ingreso en tu billetera personal.</p>
    <fieldset disabled={isSubmitting}>
      <div className="field"><label htmlFor={`${id}-amount`}>Monto en soles</label>
        <AmountInput {...field} id={`${id}-amount`} onValueChange={field.onChange}
          aria-invalid={!!errors.amount} aria-describedby={errors.amount ? `${id}-amount-error` : undefined} />
        {errors.amount && <p className="field-error" id={`${id}-amount-error`} role="alert">{errors.amount.message}</p>}
      </div>
      <div className="field"><label htmlFor={`${id}-note`}>Detalle del ingreso (opcional)</label>
        <input {...register("description")} id={`${id}-note`} maxLength={160} aria-invalid={!!errors.description}
          aria-describedby={errors.description ? `${id}-note-error` : undefined} />
        {errors.description && <p className="field-error" id={`${id}-note-error`} role="alert">{errors.description.message}</p>}
      </div>
      <div className="field"><label htmlFor={`${id}-date`}>Fecha</label>
        <input {...register("date")} id={`${id}-date`} type="date" min="1900-01-01" max={localDate()} aria-invalid={!!errors.date}
          aria-describedby={errors.date ? `${id}-date-error` : undefined} />
        {errors.date && <p className="field-error" id={`${id}-date-error`} role="alert">{errors.date.message}</p>}
      </div>
      {errors.root && <p className="inline-error" role="alert">{errors.root.message}</p>}
      <button className="primary-button full-width" type="submit" aria-busy={isSubmitting}>
        <Icon name={isSubmitting ? "loader" : "saved"} className={isSubmitting ? "spin" : undefined} size={18} />
        {isSubmitting ? "Guardando..." : "Guardar cambios"}
      </button>
      <button className="text-button centered-button" type="button" onClick={onCancel}>Cancelar edición</button>
    </fieldset>
  </form>;
}

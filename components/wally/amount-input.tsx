"use client";

import type { ComponentProps } from "react";
import { isAmountDraft, parseAmount } from "@/lib/finance";

type Props = Omit<ComponentProps<"input">, "value" | "onChange"> & {
  value: string;
  onValueChange: (value: string) => void;
};

function acceptsInsertion(input: HTMLInputElement, text: string) {
  const start = input.selectionStart ?? input.value.length;
  const end = input.selectionEnd ?? start;
  return isAmountDraft(input.value.slice(0, start) + text + input.value.slice(end));
}

/** One input policy for registration, onboarding and corrections. */
export function AmountInput({ value, onValueChange, onBlur, ...props }: Props) {
  return <input {...props} type="text" inputMode="decimal" autoComplete="off" maxLength={12} value={value}
    onBeforeInput={event => {
      const text = (event.nativeEvent as InputEvent).data;
      if (text && !acceptsInsertion(event.currentTarget, text)) event.preventDefault();
    }}
    onPaste={event => {
      if (!acceptsInsertion(event.currentTarget, event.clipboardData.getData("text"))) event.preventDefault();
    }}
    onDrop={event => {
      if (!acceptsInsertion(event.currentTarget, event.dataTransfer.getData("text"))) event.preventDefault();
    }}
    onChange={event => {
      if (isAmountDraft(event.target.value)) onValueChange(event.target.value);
      else event.target.value = value;
    }}
    onBlur={event => {
      onBlur?.(event);
      const cents = parseAmount(event.target.value);
      if (cents) onValueChange((cents / 100).toFixed(2));
    }} />;
}

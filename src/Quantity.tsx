import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { NumberInput } from "@astryxdesign/core/NumberInput";
import {
  normalizeQuantity,
  parseQuantity,
  type QuantityRule,
} from "./shopify-product-adapter";
export function Quantity({
  form,
  rule,
  value,
  onChange,
  name,
  label,
  invalidMessage,
  disabled = false,
}: {
  form: HTMLFormElement;
  rule: QuantityRule;
  value: number;
  onChange: (value: number) => void;
  name: string;
  label: string;
  invalidMessage: string;
  disabled?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [invalid, setInvalid] = useState(false);
  const latest = useRef({ rule, value, onChange, disabled });
  latest.current = { rule, value, onChange, disabled };
  function commit(): boolean {
    const field = input.current;
    if (!field || latest.current.disabled) return false;
    const number = parseQuantity(field.value, latest.current.rule);
    if (number == null) {
      setInvalid(true);
      field.focus();
      return false;
    }
    // Commit from the actual draft, not a potentially stale React render. The
    // native form serializes this exact value after the capture handler returns.
    flushSync(() => {
      latest.current.onChange(number);
      setInvalid(false);
    });
    field.value = String(number);
    return true;
  }
  useEffect(() => {
    const submit = (event: Event) => {
      if (!commit()) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    };
    // Capture pointerdown before NumberInput blur can discard an invalid draft.
    const pointer = (event: PointerEvent) => {
      if (
        (event.target as Element).closest(
          'button[type="submit"],input[type="submit"], [data-payment]',
        )
      ) {
        if (!commit()) {
          event.preventDefault();
          event.stopImmediatePropagation();
        }
      }
    };
    const enter = (event: KeyboardEvent) => {
      if (
        event.target === input.current &&
        event.key === "Enter" &&
        !event.isComposing
      ) {
        event.preventDefault();
        event.stopImmediatePropagation();
        if (commit()) form.requestSubmit();
      }
    };
    form.addEventListener("submit", submit, true);
    form.addEventListener("pointerdown", pointer, true);
    form.addEventListener("keydown", enter, true);
    return () => {
      form.removeEventListener("submit", submit, true);
      form.removeEventListener("pointerdown", pointer, true);
      form.removeEventListener("keydown", enter, true);
    };
  }, [form]);
  return (
    <NumberInput
      ref={input}
      label={label}
      htmlName={name}
      value={value}
      onChange={(number) => {
        onChange(normalizeQuantity(number, rule));
        setInvalid(false);
      }}
      min={rule.min}
      max={rule.max}
      step={rule.increment}
      hasNumberSteppers
      isIntegerOnly
      isWheelEnabled={false}
      isDisabled={disabled}
      width="100%"
      size="lg"
      status={invalid ? { type: "error", message: invalidMessage } : undefined}
    />
  );
}

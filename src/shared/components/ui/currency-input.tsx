"use client";
import { Input } from "@/shared/components/ui/input";
import { cn } from "@/shared/lib/utils";
import { NumericFormat } from "react-number-format";

interface CurrencyInputProps {
  value: string | number;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  name?: string;
  required?: boolean;
}

export function CurrencyInput({
  value,
  onValueChange,
  placeholder = "0,00",
  disabled = false,
  className,
  id,
  name,
  required = false,
}: CurrencyInputProps) {
  return (
    <NumericFormat
      value={value}
      onValueChange={(values) => {
        onValueChange(values.value);
      }}
      thousandSeparator="."
      decimalSeparator=","
      prefix="R$ "
      decimalScale={2}
      fixedDecimalScale
      allowNegative={false}
      customInput={Input}
      placeholder={placeholder}
      disabled={disabled}
      className={cn("h-11", className)}
      id={id}
      name={name}
      required={required}
    />
  );
}

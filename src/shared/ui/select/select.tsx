import type { SelectHTMLAttributes } from "react";

import styles from "./select.module.css";

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "children"> {
  options: SelectOption[];
  /** Quando informado, adiciona uma primeira opção com `value=""` (ex.: "Selecione..."). */
  placeholder?: string;
}

/** `<select>` genérico do design system. Controlado via `value`/`onChange` repassados por props. */
export function Select({ options, placeholder, className, ...props }: SelectProps) {
  const classes = [styles.select, className].filter(Boolean).join(" ");

  return (
    <select className={classes} {...props}>
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

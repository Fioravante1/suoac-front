import { type InputHTMLAttributes, forwardRef, useId } from "react";
import { Check } from "lucide-react";

import styles from "./checkbox.module.css";

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
}

/**
 * Caixa de selecao com rotulo.
 *
 * O `input` real continua no DOM, apenas invisivel: e ele que carrega estado,
 * foco e teclado, e e nele que o leitor de tela se apoia. A caixa desenhada ao
 * lado e enfeite, marcado como escondido — trocar o `input` por um `div`
 * clicavel custaria reimplementar tudo isso a mao, e pior.
 */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, className, id, ...props },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <div className={[styles.checkbox, className].filter(Boolean).join(" ")}>
      <input id={inputId} ref={ref} type="checkbox" className={styles.input} {...props} />
      <label className={styles.label} htmlFor={inputId}>
        <span className={styles.box} aria-hidden>
          <Check className={styles.check} size={12} strokeWidth={3.5} />
        </span>
        {label}
      </label>
    </div>
  );
});

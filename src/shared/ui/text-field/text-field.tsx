import { type InputHTMLAttributes, type ReactNode, forwardRef, useId } from "react";
import styles from "./text-field.module.css";

export interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  startIcon?: ReactNode;
  endIcon?: ReactNode;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  ({ label, error, startIcon, endIcon, className, id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id || generatedId;

    return (
      <div className={`${styles.wrapper} ${className || ""}`.trim()}>
        {label && (
          <label htmlFor={inputId} className={styles.label}>
            {label}
          </label>
        )}
        <div className={styles.inputContainer}>
          {startIcon && <span className={styles.startIcon}>{startIcon}</span>}
          <input
            id={inputId}
            ref={ref}
            className={`
              ${styles.input} 
              ${startIcon ? styles.hasStartIcon : ""} 
              ${endIcon ? styles.hasEndIcon : ""} 
              ${error ? styles.hasError : ""}
            `.trim()}
            {...props}
          />
          {endIcon && <span className={styles.endIcon}>{endIcon}</span>}
        </div>
        {error && <span className={styles.errorMessage}>{error}</span>}
      </div>
    );
  },
);

TextField.displayName = "TextField";

"use client";

import { type Ref, forwardRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

import { TextField, type TextFieldProps } from "@/shared/ui/text-field";

import styles from "./password-field.module.css";

type PasswordFieldProps = Omit<TextFieldProps, "type" | "endIcon">;

export const PasswordField = forwardRef(function PasswordField(props: PasswordFieldProps, ref: Ref<HTMLInputElement>) {
  const [visible, setVisible] = useState(false);

  const toggleLabel = visible ? "Ocultar senha" : "Mostrar senha";

  return (
    <TextField
      {...props}
      ref={ref}
      type={visible ? "text" : "password"}
      endIcon={
        <button
          type="button"
          className={styles.toggle}
          onClick={() => setVisible((current) => !current)}
          aria-label={toggleLabel}
          title={toggleLabel}
          tabIndex={-1}
        >
          {visible ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      }
    />
  );
});

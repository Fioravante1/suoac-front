import styles from "./spinner.module.css";

type SpinnerSize = "small" | "medium" | "large";

interface SpinnerProps {
  size?: SpinnerSize;
  className?: string;
}

const sizeClass: Record<SpinnerSize, string> = {
  small: styles.sizeSmall,
  medium: styles.sizeMedium,
  large: styles.sizeLarge,
};

export function Spinner({ size = "medium", className }: SpinnerProps) {
  return (
    <span
      className={`${styles.spinner} ${sizeClass[size]} ${className || ""}`.trim()}
      role="status"
      aria-label="Carregando"
    />
  );
}

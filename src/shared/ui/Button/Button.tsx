import { ButtonHTMLAttributes, ReactNode } from "react";
import "../ui-kit.css";

type ButtonVariant = "primary" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: ButtonVariant;
}

export const Button = ({
  children,
  className = "",
  variant = "primary",
  type = "button",
  ...props
}: ButtonProps) => (
  <button
    className={`ui-button ui-button--${variant} ${className}`.trim()}
    type={type}
    {...props}
  >
    {children}
  </button>
);

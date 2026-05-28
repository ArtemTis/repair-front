import { InputHTMLAttributes } from "react";
import "../ui-kit.css";

type TextInputProps = InputHTMLAttributes<HTMLInputElement>;

export const TextInput = ({ className = "", ...props }: TextInputProps) => (
  <input className={`ui-input ${className}`.trim()} {...props} />
);

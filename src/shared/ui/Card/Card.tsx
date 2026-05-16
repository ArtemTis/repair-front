import { HTMLAttributes, ReactNode } from "react";
import "../ui-kit.css";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export const Card = ({ children, className = "", ...props }: CardProps) => (
  <div className={`ui-card ${className}`.trim()} {...props}>
    {children}
  </div>
);

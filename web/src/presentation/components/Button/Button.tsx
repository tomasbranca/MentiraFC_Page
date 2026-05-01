import type { ButtonHTMLAttributes, ReactNode } from "react";
import {
  baseStyles,
  variants,
  activeVariants,
  type ButtonVariant,
} from "./buttonStyles";

type ButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type"> & {
  children: ReactNode;
  type?: "button" | "submit" | "reset";
  variant?: ButtonVariant;
  active?: boolean;
  showArrow?: boolean;
};

const Button = ({
  children,
  onClick,
  type = "button",
  className = "",
  disabled = false,
  variant = "primary",
  active = false,
  showArrow = false,
  ...props
}: ButtonProps) => {
  const variantStyles = variants[variant] || variants.primary;

  const activeStyles =
    active && variant in activeVariants
      ? activeVariants[variant as keyof typeof activeVariants]
      : "";

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`group ${baseStyles} ${variantStyles} ${activeStyles} ${className}`}
      {...props}
    >
      <span className="flex items-center gap-2 whitespace-nowrap">
        {children}

        {showArrow && (
          <span className="transition-transform group-hover:translate-x-1">
            →
          </span>
        )}
      </span>
    </button>
  );
};

export default Button;

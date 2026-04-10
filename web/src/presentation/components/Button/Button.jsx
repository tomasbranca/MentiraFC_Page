import React from "react";
import { baseStyles, variants, activeVariants } from "./buttonStyles";

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
}) => {
  const variantStyles = variants[variant] || variants.primary;

  const activeStyles =
    active && activeVariants[variant] ? activeVariants[variant] : "";

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
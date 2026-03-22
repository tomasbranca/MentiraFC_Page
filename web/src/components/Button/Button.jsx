import React from "react";

const Button = ({
  children,
  onClick,
  type = "button",
  className = "",
  disabled = false,
  active = false,
  variant = "default",
  ...props
}) => {
  const baseStyles = `
    inline-flex items-center justify-center
    px-5 py-3
    font-medium
    transition-all duration-300 ease-out
    focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
    active:scale-[0.98]
  `;

  const defaultStyles = `
    bg-gradient-to-br from-violet-600 to-violet-700
    text-white
    hover:from-violet-700 hover:to-violet-800
    hover:shadow-lg
    shadow-md
  `;

  const gradientStyles = active
    ? `
      bg-gradient-to-b from-violet-700 to-violet-900
      text-white
      shadow-lg
    `
    : `
      bg-neutral-800
      text-neutral-100
      border border-neutral-700
      hover:bg-neutral-700
    `;

  const variantStyles =
    variant === "gradient" ? gradientStyles : defaultStyles;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variantStyles} ${className}`}
      {...props}
    >
      <span className="whitespace-nowrap">{children}</span>
    </button>
  );
};

export default Button;
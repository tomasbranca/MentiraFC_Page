// components/Button.jsx
import React from 'react';

const Button = ({
  children,
  onClick,
  type = 'button',
  className = '',
  disabled = false,
  active = false,
  variant = 'default', // 'default' o 'gradient'
  ...props
}) => {
  // Estilos base unificados para ambos casos
  const baseStyles = `
    inline-flex items-center justify-center
    px-5 py-3
    font-medium
    rounded-xl
    transition-all duration-300 ease-out
    focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
    active:scale-[0.98]
  `;

  // Estilo principal con gradiente sutil
  const defaultStyles = `
    bg-gradient-to-br from-violet-600 to-violet-700
    text-white
    hover:from-violet-700 hover:to-violet-800
    hover:shadow-lg
    shadow-md
  `;

  // Estilo para estado activo/seleccionado (más intenso)
  const gradientStyles = active
    ? `
      bg-gradient-to-b from-violet-700 to-violet-900
      text-white
      shadow-lg
      ring-2 ring-violet-500 ring-opacity-30
    `
    : `
      bg-white
      text-gray-800
      border border-gray-200
      hover:border-violet-400
      hover:shadow-md
      hover:bg-violet-50
    `;

  // Seleccionar estilos según variant
  const variantStyles = variant === 'gradient' ? gradientStyles : defaultStyles;

  const buttonStyles = `${baseStyles} ${variantStyles} ${className}`;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={buttonStyles}
      {...props}
    >
      <span className="whitespace-nowrap">{children}</span>
    </button>
  );
};

export default Button;
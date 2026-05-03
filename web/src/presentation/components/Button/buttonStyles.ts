export const baseStyles = `
  inline-flex items-center justify-center
  gap-2
  px-4 py-2
  text-sm
  font-medium
  transition-all duration-300 ease-out
  focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2
  disabled:opacity-50 disabled:cursor-not-allowed
  active:scale-[0.97]
`;

export const variants = {
  primary: `
    bg-violet-50
    text-violet-900
    border border-violet-500/30
    rounded-lg

    hover:bg-violet-600
    hover:border-violet-400
    hover:shadow-[0_0_12px_rgba(139,92,246,0.5)]
    hover:text-violet-50
  `,

  cta: `
    bg-gradient-to-r from-violet-600 to-violet-800
    text-white
    rounded-lg

    hover:from-violet-500 hover:to-violet-700
    hover:scale-105
    hover:shadow-xl
  `,

  secondary: `
    bg-transparent
    text-neutral-200
    border border-neutral-600
    rounded-lg

    hover:bg-neutral-800
    hover:border-violet-400
  `,

  ghost: `
    bg-transparent
    text-neutral-300
    rounded-lg

    hover:bg-neutral-800
  `,

  light: `
    bg-neutral-100
    text-neutral-900
    border border-neutral-300
    shadow-sm
    rounded-lg

    hover:bg-neutral-200
    hover:shadow-md
  `,

  filter: `
  bg-neutral-800
  text-neutral-200
  border border-neutral-600
  rounded-lg

  hover:bg-violet-600
  hover:text-white
  hover:border-violet-400
`,

  toggle1: `
    bg-transparent
    text-neutral-300
    border border-neutral-500

    hover:bg-neutral-800
  `,

  toggle2: `
    bg-transparent
    text-neutral-300
    border border-violet-700

    hover:bg-neutral-800
  `,

  ghostStrong: `
    bg-neutral-900
    text-neutral-300
    rounded-lg

    hover:bg-neutral-800
    hover:text-white

    border border-neutral-800
  `,
} as const;

export const activeVariants = {
  filter: "bg-violet-600 text-white border-violet-400 shadow-md",
  toggle: "bg-violet-600 text-white border-violet-500 shadow-md",
} as const;

export type ButtonVariant = keyof typeof variants;

import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const baseProps = {
  fill: "none",
  stroke: "currentColor",
  strokeLinecap: "round",
  strokeLinejoin: "round",
  strokeWidth: 2,
  viewBox: "0 0 24 24",
} as const;

export const MenuIcon = (props: IconProps) => (
  <svg aria-hidden="true" {...baseProps} {...props}>
    <path d="M4 7h16" />
    <path d="M4 12h16" />
    <path d="M4 17h16" />
  </svg>
);

export const CloseIcon = (props: IconProps) => (
  <svg aria-hidden="true" {...baseProps} {...props}>
    <path d="M6 6l12 12" />
    <path d="M18 6L6 18" />
  </svg>
);

export const MailIcon = (props: IconProps) => (
  <svg aria-hidden="true" {...baseProps} {...props}>
    <path d="M4 6h16v12H4z" />
    <path d="M4 8l8 6 8-6" />
  </svg>
);

export const AlertTriangleIcon = (props: IconProps) => (
  <svg aria-hidden="true" {...baseProps} {...props}>
    <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
    <path d="M12 9v4" />
    <path d="M12 17h.01" />
  </svg>
);

export const SoccerBallIcon = (props: IconProps) => (
  <svg aria-hidden="true" viewBox="0 0 512 512" fill="currentColor" {...props}>
    <path d="M504 256c0 136.967-111.033 248-248 248S8 392.967 8 256 119.033 8 256 8s248 111.033 248 248zm-48 0l-.003-.282-26.064 22.741-62.679-58.5 16.454-84.355 34.303 3.072c-24.889-34.216-60.004-60.089-100.709-73.141l13.651 31.939L256 139l-74.953-41.525 13.651-31.939c-40.631 13.028-75.78 38.87-100.709 73.141l34.565-3.073 16.192 84.355-62.678 58.5-26.064-22.741-.003.282c0 43.015 13.497 83.952 38.472 117.991l7.704-33.897 85.138 10.447 36.301 77.826-29.902 17.786c40.202 13.122 84.29 13.148 124.572 0l-29.902-17.786 36.301-77.826 85.138-10.447 7.704 33.897C442.503 339.952 456 299.015 456 256zm-248.102 69.571l-29.894-91.312L256 177.732l77.996 56.527-29.622 91.312h-96.476z" />
  </svg>
);

export const InstagramIcon = (props: IconProps) => (
  <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M7.8 2h8.4A5.8 5.8 0 0122 7.8v8.4a5.8 5.8 0 01-5.8 5.8H7.8A5.8 5.8 0 012 16.2V7.8A5.8 5.8 0 017.8 2zm0 1.8A4 4 0 003.8 7.8v8.4a4 4 0 004 4h8.4a4 4 0 004-4V7.8a4 4 0 00-4-4H7.8zm8.9 1.4a1.1 1.1 0 110 2.2 1.1 1.1 0 010-2.2zM12 7a5 5 0 110 10 5 5 0 010-10zm0 1.8a3.2 3.2 0 100 6.4 3.2 3.2 0 000-6.4z" />
  </svg>
);

export const TikTokIcon = (props: IconProps) => (
  <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M14.4 2h2.5c.2 1.3.9 2.4 2.1 3.1.8.5 1.7.8 2.6.8v2.5a7.2 7.2 0 01-4.7-1.6v7.2a6 6 0 11-6-6h.2v2.6h-.2a3.4 3.4 0 103.4 3.4V2z" />
  </svg>
);

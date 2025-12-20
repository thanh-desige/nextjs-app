/**
 * Button - Reusable button component
 */

"use client";

import React from "react";

// ==================== Types ====================

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "danger"
  | "success";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Button variant */
  variant?: ButtonVariant;
  /** Button size */
  size?: ButtonSize;
  /** Left icon */
  leftIcon?: React.ReactNode;
  /** Right icon */
  rightIcon?: React.ReactNode;
  /** Loading state */
  loading?: boolean;
  /** Full width */
  fullWidth?: boolean;
}

// ==================== Styles ====================

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-blue-600 text-white hover:bg-blue-500 active:bg-blue-700 focus:ring-blue-500",
  secondary:
    "bg-gray-700 text-white hover:bg-gray-600 active:bg-gray-800 focus:ring-gray-500",
  ghost:
    "bg-transparent text-gray-300 hover:bg-gray-700 hover:text-white focus:ring-gray-500",
  danger:
    "bg-red-600 text-white hover:bg-red-500 active:bg-red-700 focus:ring-red-500",
  success:
    "bg-green-600 text-white hover:bg-green-500 active:bg-green-700 focus:ring-green-500",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-2.5 py-1.5 text-xs gap-1.5",
  md: "px-4 py-2 text-sm gap-2",
  lg: "px-6 py-3 text-base gap-2.5",
};

const iconSizes: Record<ButtonSize, string> = {
  sm: "w-3.5 h-3.5",
  md: "w-4 h-4",
  lg: "w-5 h-5",
};

// ==================== Button Component ====================

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  leftIcon,
  rightIcon,
  loading = false,
  fullWidth = false,
  disabled,
  className = "",
  children,
  ...props
}) => {
  const isDisabled = disabled || loading;

  return (
    <button
      type="button"
      disabled={isDisabled}
      className={`
        inline-flex items-center justify-center font-medium rounded-lg
        transition-colors duration-150 ease-in-out
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${fullWidth ? "w-full" : ""}
        ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <svg
          className={`animate-spin ${iconSizes[size]}`}
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      ) : leftIcon ? (
        <span className={iconSizes[size]}>{leftIcon}</span>
      ) : null}

      {children}

      {rightIcon && !loading && (
        <span className={iconSizes[size]}>{rightIcon}</span>
      )}
    </button>
  );
};

export default Button;

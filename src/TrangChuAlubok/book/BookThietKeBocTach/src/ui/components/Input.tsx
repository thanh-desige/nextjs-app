/**
 * Input - Reusable input component
 */

"use client";

import React, { forwardRef, useId } from "react";

// ==================== Types ====================

export type InputSize = "sm" | "md" | "lg";

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  /** Input size */
  size?: InputSize;
  /** Label */
  label?: string;
  /** Helper text */
  helperText?: string;
  /** Error message */
  error?: string;
  /** Left addon */
  leftAddon?: React.ReactNode;
  /** Right addon */
  rightAddon?: React.ReactNode;
  /** Left icon */
  leftIcon?: React.ReactNode;
  /** Right icon */
  rightIcon?: React.ReactNode;
  /** Full width */
  fullWidth?: boolean;
}

// ==================== Styles ====================

const sizeStyles: Record<InputSize, string> = {
  sm: "px-2.5 py-1.5 text-xs",
  md: "px-3 py-2 text-sm",
  lg: "px-4 py-3 text-base",
};

const iconPadding: Record<InputSize, { left: string; right: string }> = {
  sm: { left: "pl-7", right: "pr-7" },
  md: { left: "pl-9", right: "pr-9" },
  lg: { left: "pl-11", right: "pr-11" },
};

const iconSizes: Record<InputSize, string> = {
  sm: "w-3.5 h-3.5",
  md: "w-4 h-4",
  lg: "w-5 h-5",
};

// ==================== Input Component ====================

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      size = "md",
      label,
      helperText,
      error,
      leftAddon,
      rightAddon,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      className = "",
      id,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const hasError = Boolean(error);

    const inputClasses = `
    w-full bg-gray-700 text-white rounded-lg border
    transition-colors duration-150
    focus:outline-none focus:ring-2 focus:ring-offset-0
    placeholder:text-gray-500
    disabled:opacity-50 disabled:cursor-not-allowed
    ${sizeStyles[size]}
    ${leftIcon ? iconPadding[size].left : ""}
    ${rightIcon ? iconPadding[size].right : ""}
    ${
      hasError
        ? "border-red-500 focus:border-red-500 focus:ring-red-500"
        : "border-gray-600 focus:border-blue-500 focus:ring-blue-500"
    }
    ${className}
  `;

    const input = (
      <div className="relative">
        {leftIcon && (
          <div
            className={`absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 ${iconSizes[size]}`}
          >
            {leftIcon}
          </div>
        )}

        <input
          ref={ref}
          id={inputId}
          disabled={disabled}
          className={inputClasses}
          aria-invalid={hasError}
          aria-describedby={
            error
              ? `${inputId}-error`
              : helperText
              ? `${inputId}-helper`
              : undefined
          }
          {...props}
        />

        {rightIcon && (
          <div
            className={`absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 ${iconSizes[size]}`}
          >
            {rightIcon}
          </div>
        )}
      </div>
    );

    const wrappedInput =
      leftAddon || rightAddon ? (
        <div className="flex">
          {leftAddon && (
            <div className="flex items-center px-3 bg-gray-800 border border-r-0 border-gray-600 rounded-l-lg text-gray-400 text-sm">
              {leftAddon}
            </div>
          )}
          <div
            className={`flex-1 ${
              leftAddon ? "[&>div>input]:rounded-l-none" : ""
            } ${rightAddon ? "[&>div>input]:rounded-r-none" : ""}`}
          >
            {input}
          </div>
          {rightAddon && (
            <div className="flex items-center px-3 bg-gray-800 border border-l-0 border-gray-600 rounded-r-lg text-gray-400 text-sm">
              {rightAddon}
            </div>
          )}
        </div>
      ) : (
        input
      );

    return (
      <div className={fullWidth ? "w-full" : ""}>
        {label && (
          <label
            htmlFor={inputId}
            className="block mb-1.5 text-sm font-medium text-gray-300"
          >
            {label}
          </label>
        )}

        {wrappedInput}

        {error && (
          <p id={`${inputId}-error`} className="mt-1.5 text-xs text-red-400">
            {error}
          </p>
        )}

        {helperText && !error && (
          <p id={`${inputId}-helper`} className="mt-1.5 text-xs text-gray-500">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;

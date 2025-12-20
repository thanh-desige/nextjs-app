/**
 * Dropdown - Reusable dropdown/select component
 */

"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";

// ==================== Types ====================

export interface DropdownOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  divider?: boolean;
}

export interface DropdownProps {
  /** Dropdown options */
  options: DropdownOption[];
  /** Selected value */
  value?: string;
  /** Change handler */
  onChange: (value: string) => void;
  /** Placeholder */
  placeholder?: string;
  /** Label */
  label?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Error message */
  error?: string;
  /** Full width */
  fullWidth?: boolean;
  /** Searchable */
  searchable?: boolean;
  /** Additional class name */
  className?: string;
}

// ==================== Dropdown Component ====================

export const Dropdown: React.FC<DropdownProps> = ({
  options,
  value,
  onChange,
  placeholder = "Select...",
  label,
  disabled = false,
  error,
  fullWidth = false,
  searchable = false,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((o) => o.value === value);

  // Filter options based on search
  const filteredOptions =
    searchable && searchQuery.trim()
      ? options.filter(
          (o) =>
            !o.divider &&
            o.label.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : options;

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        setSearchQuery("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen && searchable && searchRef.current) {
      searchRef.current.focus();
    }
  }, [isOpen, searchable]);

  const handleToggle = useCallback(() => {
    if (!disabled) {
      setIsOpen(!isOpen);
      setSearchQuery("");
      setHighlightedIndex(-1);
    }
  }, [disabled, isOpen]);

  const handleSelect = useCallback(
    (option: DropdownOption) => {
      if (!option.disabled && !option.divider) {
        onChange(option.value);
        setIsOpen(false);
        setSearchQuery("");
      }
    },
    [onChange]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const enabledOptions = filteredOptions.filter(
        (o) => !o.disabled && !o.divider
      );

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setHighlightedIndex((prev) =>
            prev < enabledOptions.length - 1 ? prev + 1 : 0
          );
          break;

        case "ArrowUp":
          e.preventDefault();
          setHighlightedIndex((prev) =>
            prev > 0 ? prev - 1 : enabledOptions.length - 1
          );
          break;

        case "Enter":
          e.preventDefault();
          if (
            isOpen &&
            highlightedIndex >= 0 &&
            enabledOptions[highlightedIndex]
          ) {
            handleSelect(enabledOptions[highlightedIndex]);
          } else {
            handleToggle();
          }
          break;

        case "Escape":
          e.preventDefault();
          setIsOpen(false);
          setSearchQuery("");
          break;
      }
    },
    [filteredOptions, isOpen, highlightedIndex, handleSelect, handleToggle]
  );

  const hasError = Boolean(error);

  return (
    <div
      ref={containerRef}
      className={`relative ${fullWidth ? "w-full" : ""} ${className}`}
    >
      {label && (
        <label className="block mb-1.5 text-sm font-medium text-gray-300">
          {label}
        </label>
      )}

      {/* Trigger button */}
      <button
        type="button"
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={`
          w-full flex items-center justify-between gap-2
          px-3 py-2 text-sm text-left
          bg-gray-700 rounded-lg border
          transition-colors duration-150
          focus:outline-none focus:ring-2 focus:ring-offset-0
          disabled:opacity-50 disabled:cursor-not-allowed
          ${isOpen ? "border-blue-500 ring-2 ring-blue-500" : ""}
          ${
            hasError
              ? "border-red-500 focus:border-red-500 focus:ring-red-500"
              : "border-gray-600 focus:border-blue-500 focus:ring-blue-500"
          }
        `}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className={selectedOption ? "text-white" : "text-gray-500"}>
          {selectedOption ? (
            <span className="flex items-center gap-2">
              {selectedOption.icon}
              {selectedOption.label}
            </span>
          ) : (
            placeholder
          )}
        </span>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl overflow-hidden">
          {/* Search input */}
          {searchable && (
            <div className="p-2 border-b border-gray-700">
              <input
                ref={searchRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setHighlightedIndex(0);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Search..."
                className="w-full px-2 py-1.5 text-sm bg-gray-700 text-white rounded border border-gray-600 outline-none focus:border-blue-500"
              />
            </div>
          )}

          {/* Options list */}
          <ul className="max-h-60 overflow-y-auto py-1" role="listbox">
            {filteredOptions.length === 0 ? (
              <li className="px-3 py-2 text-sm text-gray-500 text-center">
                No options found
              </li>
            ) : (
              filteredOptions.map((option, index) =>
                option.divider ? (
                  <li
                    key={`divider-${index}`}
                    className="my-1 border-t border-gray-700"
                  />
                ) : (
                  <li
                    key={option.value}
                    role="option"
                    aria-selected={option.value === value}
                    onClick={() => handleSelect(option)}
                    className={`
                      flex items-center gap-2 px-3 py-2 text-sm cursor-pointer
                      ${
                        option.disabled
                          ? "text-gray-600 cursor-not-allowed"
                          : option.value === value
                          ? "bg-blue-600 text-white"
                          : highlightedIndex === index
                          ? "bg-gray-700 text-white"
                          : "text-gray-300 hover:bg-gray-700 hover:text-white"
                      }
                    `}
                  >
                    {option.icon}
                    {option.label}
                    {option.value === value && (
                      <svg
                        className="w-4 h-4 ml-auto"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                      </svg>
                    )}
                  </li>
                )
              )
            )}
          </ul>
        </div>
      )}

      {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
    </div>
  );
};

export default Dropdown;

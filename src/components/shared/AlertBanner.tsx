"use client";

import React from "react";
import { CheckCircle2, AlertCircle, X } from "lucide-react";

export interface AlertBannerProps {
  /** Explicit success message text string */
  success?: string | null;
  /** Direct error instance, raw string, or parsed backend exception payload */
  error?: unknown | null;
  /** Optional function to clear messages (if provided, renders a close trigger icon button) */
  onClose?: () => void;
}

export default function AlertBanner({ success, error, onClose }: AlertBannerProps) {
  // 1. Return immediately if no operational tracking state exists
  if (!success && !error) return null;

  // 2. Localized helper to drill straight down into backend JSON API payloads safely
  const getDisplayMessage = (): string => {
    if (success) return success;
    if (!error) return "";
    
    // Type narrowing guards satisfy strict compiler checks
    if (typeof error === "string") return error;
    if (error instanceof Error) return error.message;
    
    // Safely check for generic record structures returned by the fetch layer
    if (typeof error === "object" && error !== null) {
      const obj = error as Record<string, unknown>;
      
      if (typeof obj.message === "string") return obj.message;
      
      if (typeof obj.error === "object" && obj.error !== null) {
        const nestedError = obj.error as Record<string, unknown>;
        if (typeof nestedError.message === "string") return nestedError.message;
      }
    }
    
    return "An unexpected operational execution failure occurred.";
  };

  const isSuccess = Boolean(success);
  const displayMessage = getDisplayMessage();

  return (
    <div
      className={`flex items-start gap-3 rounded-xl border p-4 text-sm font-semibold leading-normal shadow-xs transition-all duration-300 animate-in fade-in zoom-in-95 ${
        isSuccess
          ? "border-emerald-200 dark:border-emerald-950/40 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400"
          : "border-red-200 dark:border-red-950/40 bg-red-50/50 dark:bg-red-950/20 text-red-800 dark:text-red-400"
      }`}
    >
      {/* Icon Selector Mapping */}
      {isSuccess ? (
        <CheckCircle2 size={18} className="shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
      ) : (
        <AlertCircle size={18} className="shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
      )}

      {/* Target Notification Message Text */}
      <p className="flex-1">{displayMessage}</p>

      {/* Optional Quick Dismissal Trigger */}
      {onClose && (
        <button
          onClick={onClose}
          type="button"
          className={`shrink-0 rounded-lg p-0.5 transition cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 ${
            isSuccess ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
          }`}
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (type: ToastType, message: string, duration?: number) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((type: ToastType, message: string, duration = 5000) => {
    const id = Math.random().toString(36).substring(2);
    setToasts((prev) => [...prev, { id, type, message, duration }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, showToast, dismissToast }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
}

function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 20,
        right: 20,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        maxWidth: 400
      }}
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const [isExiting, setIsExiting] = useState(false);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => onDismiss(toast.id), 200);
  };

  const colors = {
    success: { bg: "#d1fae5", border: "#10b981", text: "#065f46", icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
    error: { bg: "#fee2e2", border: "#ef4444", text: "#991b1b", icon: "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" },
    warning: { bg: "#fef3c7", border: "#f59e0b", text: "#92400e", icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" },
    info: { bg: "#dbeafe", border: "#3b82f6", text: "#1e40af", icon: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" }
  };

  const color = colors[toast.type];

  return (
    <div
      style={{
        backgroundColor: color.bg,
        borderLeft: `4px solid ${color.border}`,
        borderRadius: 8,
        padding: "12px 16px",
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        opacity: isExiting ? 0 : 1,
        transform: isExiting ? "translateX(100%)" : "translateX(0)",
        transition: "all 0.2s ease-out"
      }}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke={color.border}
        strokeWidth="2"
        style={{ flexShrink: 0, marginTop: 2 }}
      >
        <path d={color.icon} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <p style={{ margin: 0, color: color.text, fontSize: 14, flex: 1 }}>{toast.message}</p>
      <button
        onClick={handleDismiss}
        style={{
          background: "none",
          border: "none",
          padding: 0,
          cursor: "pointer",
          color: color.text,
          opacity: 0.6
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}

// Simple function for pages that can't use hooks easily
let globalShowToast: ((type: ToastType, message: string, duration?: number) => void) | null = null;

export function setGlobalToast(fn: typeof globalShowToast) {
  globalShowToast = fn;
}

export function toast(type: ToastType, message: string, duration?: number) {
  if (globalShowToast) {
    globalShowToast(type, message, duration);
  } else {
    // Fallback to alert if toast not available
    console.warn("Toast not initialized, falling back to console");
    console.log(`[${type.toUpperCase()}] ${message}`);
  }
}

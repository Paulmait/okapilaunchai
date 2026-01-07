"use client";

import React, { useEffect } from "react";
import { ToastProvider, useToast, setGlobalToast } from "./Toast";

function ToastInitializer({ children }: { children: React.ReactNode }) {
  const { showToast } = useToast();

  useEffect(() => {
    setGlobalToast(showToast);
    return () => setGlobalToast(null);
  }, [showToast]);

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <ToastInitializer>{children}</ToastInitializer>
    </ToastProvider>
  );
}

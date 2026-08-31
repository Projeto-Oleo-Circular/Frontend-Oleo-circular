import React, { createContext, useCallback, useContext, useState } from "react";
import ToastContainer, { ToastItem } from "../components/ui/ToastContainer";

export interface ToastOptions {
  message: string;
  type?: "error" | "success" | "warning" | "info";
  duration?: number;
}

export interface ToastContextData {
  addToast: (
    optionsOrMessage: ToastOptions | string,
    typeParam?: "error" | "success" | "warning" | "info"
  ) => void;
  removeToast: (id: string) => void;
}

export const ToastContext = createContext<ToastContextData | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback(
    (
      optionsOrMessage: ToastOptions | string,
      typeParam: "error" | "success" | "warning" | "info" = "error"
    ) => {
      const id = Math.random().toString(36).substring(2, 9);

      const message =
        typeof optionsOrMessage === "string"
          ? optionsOrMessage
          : optionsOrMessage.message;

      const type =
        typeof optionsOrMessage === "string"
          ? typeParam
          : optionsOrMessage.type || "error";

      const duration =
        typeof optionsOrMessage === "object" && optionsOrMessage.duration
          ? optionsOrMessage.duration
          : 3000;

      setToasts((prev) => [...prev, { id, message, type, duration }]);
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </ToastContext.Provider>
  );
};

export function useToast(): ToastContextData {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast deve ser utilizado dentro de um ToastProvider");
  }
  return context;
}

export default useToast;
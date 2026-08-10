import React, {
  createContext,
  useCallback,
  useContext,
  useState,
} from "react";

export interface ToastOptions {
  message: string;
  type?: "error" | "success" | "info";
}

export interface ToastItem {
  id: string;
  message: string;
  type: "error" | "success" | "info";
}

export interface ToastContextData {
  addToast: (
    optionsOrMessage: ToastOptions | string,
    typeParam?: "error" | "success" | "info"
  ) => void;

  removeToast: (id: string) => void;
}

export const ToastContext = createContext<
  ToastContextData | undefined
>(undefined);

export const ToastProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback(
    (
      optionsOrMessage: ToastOptions | string,
      typeParam: "error" | "success" | "info" = "error"
    ) => {
      const id = Math.random()
        .toString(36)
        .substring(2, 9);

      const message =
        typeof optionsOrMessage === "string"
          ? optionsOrMessage
          : optionsOrMessage.message;

      const type =
        typeof optionsOrMessage === "string"
          ? typeParam
          : optionsOrMessage.type || "error";

      setToasts((prev) => [
        ...prev,
        {
          id,
          message,
          type,
        },
      ]);

      setTimeout(() => {
        setToasts((prev) =>
          prev.filter((toast) => toast.id !== id)
        );
      }, 4000);
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) =>
      prev.filter((toast) => toast.id !== id)
    );
  }, []);

  return (
    <ToastContext.Provider
      value={{
        addToast,
        removeToast,
      }}
    >
      {children}

      <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2 max-w-sm w-full px-4 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start justify-between p-4 rounded-xl shadow-lg border text-sm font-medium animate-fade-in-down ${
              toast.type === "error"
                ? "bg-red-50 border-red-200 text-red-700"
                : toast.type === "success"
                ? "bg-green-50 border-green-200 text-green-700"
                : "bg-blue-50 border-blue-200 text-blue-700"
            }`}
          >
            <span className="flex-1 pr-2">
              {toast.message}
            </span>

            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className="text-gray-400 hover:text-gray-600 font-bold ml-2 focus:outline-none"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export function useToast(): ToastContextData {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error(
      "useToast deve ser utilizado dentro de um ToastProvider"
    );
  }

  return context;
}

export default useToast;
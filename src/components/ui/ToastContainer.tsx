import { createPortal } from "react-dom";
import Toast from "./Toast";

export interface ToastItem {
  id: string;
  message: string;
  type: "error" | "success" | "warning" | "info";
  duration?: number;
}

interface Props {
  toasts?: ToastItem[];
  onClose: (id: string) => void;
}

function ToastContainer({ toasts = [], onClose }: Props) {
  if (toasts.length === 0) return null;

  return createPortal(
    // Posiciona no topo e centraliza horizontalmente
    <div className="fixed top-5 left-0 right-0 z-[9999] pointer-events-none flex flex-col items-center gap-3 px-4">
      <div className="w-full max-w-sm sm:max-w-md flex flex-col gap-3">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto w-full">
            <Toast
              message={toast.message}
              type={toast.type}
              duration={toast.duration}
              onClose={() => onClose(toast.id)}
            />
          </div>
        ))}
      </div>
    </div>,
    document.body
  );
}

export default ToastContainer;
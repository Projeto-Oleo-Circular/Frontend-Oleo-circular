import Toast from './Toast'

interface ToastItem {
  id: string
  message: string
  type: 'error' | 'success' | 'info'
}

interface Props {
  toasts: ToastItem[]
  onClose: (id: string) => void
}

function ToastContainer({ toasts, onClose }: Props) {
  if (toasts.length === 0) return null

  const toast = toasts[0]

  return (
    <div className="fixed top-4 left-0 right-0 z-[9999] flex flex-col items-center pointer-events-none px-4 sm:px-6">
      <div className="pointer-events-auto w-full max-w-sm sm:max-w-md">
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => onClose(toast.id)}
        />
      </div>
    </div>
  )
}

export default ToastContainer
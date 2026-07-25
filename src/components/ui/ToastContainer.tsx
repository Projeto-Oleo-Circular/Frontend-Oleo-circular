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
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50">
      <Toast
        key={toast.id}
        message={toast.message}
        type={toast.type}
        onClose={() => onClose(toast.id)}
      />
    </div>
  )
}

export default ToastContainer
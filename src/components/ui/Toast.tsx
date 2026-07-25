import { useEffect, useState } from 'react'

interface ToastProps {
  message: string
  type: 'error' | 'success' | 'info'
  onClose: () => void
  duration?: number
}

function Toast({ message, type, onClose, duration = 5000 }: ToastProps) {
  const [progress, setProgress] = useState(100)

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev <= 0) {
          clearInterval(interval)
          return 0
        }
        return prev - (100 / (duration / 100))
      })
    }, 100)

    const timer = setTimeout(() => {
      onClose()
    }, duration)

    return () => {
      clearTimeout(timer)
      clearInterval(interval)
    }
  }, [onClose, duration])

  const icons = {
    error: (
      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-red-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
    ),
    success: (
      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      </div>
    ),
    info: (
      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
        <svg className="w-5 h-5 text-blue-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
    ),
  }

  const progressColors = {
    error: 'bg-red-primary',
    success: 'bg-green-primary',
    info: 'bg-blue-primary',
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden w-80 sm:w-90 md:w-96 max-w-md mx-4">
      <div className="flex items-center gap-3 sm:gap-4 px-4 py-3">
        {icons[type]}
        <p className="text-black-primary font-bold text-sm flex-1">{message}</p>
      </div>

      <div className="h-1 bg-white-200 w-full">
        <div
          className={`h-1 ${progressColors[type]} transition-all duration-100`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}

export default Toast
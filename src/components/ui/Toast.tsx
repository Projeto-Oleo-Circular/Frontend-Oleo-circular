import { useEffect, useState } from 'react'

interface ToastProps {
  message: string
  type: 'error' | 'success' | 'info'
  onClose: () => void
  duration?: number
}

function Toast({ message, type, onClose, duration = 5000 }: ToastProps) {
  const [progress, setProgress] = useState(100)
  const [isVisible, setIsVisible] = useState(true)

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
      setIsVisible(false)
      setTimeout(onClose, 300)
    }, duration)

    return () => {
      clearTimeout(timer)
      clearInterval(interval)
    }
  }, [onClose, duration])

  if (!isVisible) return null

  const icons = {
    error: (
      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
    ),
    success: (
      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      </div>
    ),
    info: (
      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
    ),
  }

  const progressColors = {
    error: 'bg-red-500',
    success: 'bg-green-600',
    info: 'bg-blue-600',
  }

  const bgColors = {
    error: 'border-red-200',
    success: 'border-green-200',
    info: 'border-blue-200',
  }

  return (
    <div className={`bg-white rounded-2xl shadow-xl overflow-hidden w-full border ${bgColors[type]} animate-slide-down`}>
      <div className="flex items-center gap-3 px-4 py-3">
        {icons[type]}
        <p className="text-black-primary font-medium text-sm sm:text-base flex-1">{message}</p>
        <button 
          onClick={() => { setIsVisible(false); setTimeout(onClose, 300); }} 
          className="flex-shrink-0 ml-2"
        >
          <svg className="w-5 h-5 text-white-400 hover:text-white-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="h-1 bg-white-primary w-full">
        <div
          className={`h-1 ${progressColors[type]} transition-all duration-100`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}

export default Toast
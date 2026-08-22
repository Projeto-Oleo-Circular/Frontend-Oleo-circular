import { useEffect, useState } from 'react'

export interface ToastProps {
  message: string
  type: 'error' | 'success' | 'warning' | 'info'
  onClose: () => void
  duration?: number
}

function Toast({ message, type, onClose, duration = 4000 }: ToastProps) {
  const [progress, setProgress] = useState(100)
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev <= 0) {
          clearInterval(interval)
          return 0
        }
        return prev - (100 / (duration / 50))
      })
    }, 50)

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
      <div className="w-10 h-10 rounded-2xl bg-red-50 flex items-center justify-center flex-shrink-0">
        <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
    ),
    success: (
      <div className="w-10 h-10 rounded-2xl bg-green-50 flex items-center justify-center flex-shrink-0">
        <svg className="w-5 h-5 text-green-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      </div>
    ),
    warning: (
      <div className="w-10 h-10 rounded-2xl bg-orange-50 flex items-center justify-center flex-shrink-0">
        <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
    ),
    info: (
      <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center flex-shrink-0">
        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
    ),
  }

  const progressColors = {
    error: 'bg-red-500',
    success: 'bg-green-primary',
    warning: 'bg-orange-500',
    info: 'bg-blue-600',
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden w-full border border-white-100 transition-all">
      <div className="flex items-center gap-3.5 px-4 py-3.5">
        {icons[type]}
        <p className="text-black-primary font-semibold text-sm flex-1">{message}</p>
        <button 
          onClick={() => { setIsVisible(false); setTimeout(onClose, 300); }} 
          className="flex-shrink-0 ml-2 text-white-400 hover:text-white-600 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="h-1.5 bg-white-100 w-full overflow-hidden">
        <div
          className={`h-full ${progressColors[type]} transition-all duration-75 linear`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}

export default Toast
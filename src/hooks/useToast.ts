import { useState, useCallback } from 'react'

interface ToastOptions {
  message: string
  type?: 'error' | 'success' | 'info'
}

interface ToastItem {
  id: string
  message: string
  type: 'error' | 'success' | 'info'
}

function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const addToast = useCallback((optionsOrMessage: ToastOptions | string, typeParam: 'error' | 'success' | 'info' = 'error') => {
    const id = Math.random().toString(36).substring(2)
    
    const message = typeof optionsOrMessage === 'string' ? optionsOrMessage : optionsOrMessage.message
    const type = typeof optionsOrMessage === 'string' ? typeParam : (optionsOrMessage.type || 'error')

    setToasts(prev => [...prev, { id, message, type }])
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return { toasts, addToast, removeToast }
}

export default useToast
import { useState, useCallback } from 'react'

interface ToastOptions {
  title: string
  description?: string
  variant?: 'default' | 'success' | 'error' | 'warning'
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastOptions[]>([])

  const toast = useCallback((options: ToastOptions) => {
    setToasts((prev) => [...prev, options])
    setTimeout(() => {
      setToasts((prev) => prev.slice(1))
    }, 3000)
  }, [])

  return { toast, toasts }
}

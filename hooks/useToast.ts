import { useCallback } from 'react'
import toast from 'react-hot-toast'

interface ToastOptions {
  duration?: number
  position?: 'top-center' | 'top-right' | 'bottom-center' | 'bottom-right'
}

export function useToast() {
  const success = useCallback((message: string, options?: ToastOptions) => {
    return toast.success(message, {
      duration: options?.duration || 4000,
      position: options?.position || 'top-center',
      style: {
        background: '#10b981',
        color: '#fff',
        borderRadius: '0.75rem',
        padding: '1rem 1.5rem',
        fontSize: '0.875rem',
        fontWeight: '600',
      },
      icon: '✅',
    })
  }, [])

  const error = useCallback((message: string, options?: ToastOptions) => {
    return toast.error(message, {
      duration: options?.duration || 5000,
      position: options?.position || 'top-center',
      style: {
        background: '#ef4444',
        color: '#fff',
        borderRadius: '0.75rem',
        padding: '1rem 1.5rem',
        fontSize: '0.875rem',
        fontWeight: '600',
      },
      icon: '❌',
    })
  }, [])

  const loading = useCallback((message: string, options?: ToastOptions) => {
    return toast.loading(message, {
      position: options?.position || 'top-center',
      style: {
        background: '#3b82f6',
        color: '#fff',
        borderRadius: '0.75rem',
        padding: '1rem 1.5rem',
        fontSize: '0.875rem',
        fontWeight: '600',
      },
    })
  }, [])

  const promise = useCallback(
    <T,>(
      promise: Promise<T>,
      messages: {
        loading: string
        success: string | ((data: T) => string)
        error: string | ((error: Error) => string)
      },
      options?: ToastOptions
    ) => {
      return toast.promise(
        promise,
        {
          loading: messages.loading,
          success: messages.success,
          error: messages.error,
        },
        {
          position: options?.position || 'top-center',
          style: {
            borderRadius: '0.75rem',
            padding: '1rem 1.5rem',
            fontSize: '0.875rem',
            fontWeight: '600',
          },
        }
      )
    },
    []
  )

  const dismiss = useCallback((toastId?: string) => {
    if (toastId) {
      toast.dismiss(toastId)
    } else {
      toast.dismiss()
    }
  }, [])

  const custom = useCallback((message: string, options?: ToastOptions & { icon?: string }) => {
    return toast(message, {
      duration: options?.duration || 4000,
      position: options?.position || 'top-center',
      icon: options?.icon,
      style: {
        background: '#1e293b',
        color: '#fff',
        borderRadius: '0.75rem',
        padding: '1rem 1.5rem',
        fontSize: '0.875rem',
        fontWeight: '600',
        border: '1px solid #334155',
      },
    })
  }, [])

  return {
    success,
    error,
    loading,
    promise,
    dismiss,
    custom,
  }
}

// Enhanced toast with better error handling
export function useEnhancedToast() {
  const toast = useToast()

  const handleError = useCallback((error: unknown, fallbackMessage = 'An error occurred') => {
    let message = fallbackMessage
    
    if (error instanceof Error) {
      message = error.message
    } else if (typeof error === 'string') {
      message = error
    } else if (error && typeof error === 'object' && 'message' in error) {
      message = String(error.message)
    }

    // Clean up common error patterns
    message = message
      .replace(/^Error:\s*/i, '')
      .replace(/\[.*?\]\s*/g, '')
      .trim()

    return toast.error(message)
  }, [toast])

  const handleSuccess = useCallback((message: string, details?: string) => {
    if (details) {
      return toast.custom(`${message} • ${details}`, { icon: '✅' })
    }
    return toast.success(message)
  }, [toast])

  return {
    ...toast,
    handleError,
    handleSuccess,
  }
}

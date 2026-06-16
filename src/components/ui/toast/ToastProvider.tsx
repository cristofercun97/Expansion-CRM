import { CheckCircle2, Info, X } from 'lucide-react'
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { cn } from '@/lib/utils'

type ToastVariant = 'success' | 'info'

type Toast = {
  id: string
  message: string
  variant: ToastVariant
}

type ToastContextValue = {
  showToast: (message: string, variant?: ToastVariant) => void
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined)

const TOAST_DURATION_MS = 4000

const variantStyles: Record<ToastVariant, string> = {
  success: 'border-teal-accent/40 bg-petrol-deep/95 text-hero-text',
  info: 'border-gold/40 bg-petrol-deep/95 text-hero-text',
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const showToast = useCallback(
    (message: string, variant: ToastVariant = 'success') => {
      const id = crypto.randomUUID()
      setToasts((current) => [...current, { id, message, variant }])
      window.setTimeout(() => removeToast(id), TOAST_DURATION_MS)
    },
    [removeToast],
  )

  const value = useMemo(() => ({ showToast }), [showToast])

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2 px-4 sm:px-0"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={cn(
              'pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 shadow-[0_16px_40px_rgba(0,0,0,0.35)] backdrop-blur-md',
              'animate-[toast-in_0.25s_ease-out]',
              variantStyles[toast.variant],
            )}
          >
            {toast.variant === 'success' ? (
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-teal-accent" aria-hidden="true" />
            ) : (
              <Info className="mt-0.5 h-5 w-5 shrink-0 text-gold" aria-hidden="true" />
            )}

            <p className="flex-1 text-sm font-medium leading-snug">{toast.message}</p>

            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className="cursor-pointer rounded-md p-0.5 text-hero-text/60 transition-colors hover:text-hero-text"
              aria-label="Cerrar notificación"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)

  if (!context) {
    throw new Error('useToast debe usarse dentro de ToastProvider.')
  }

  return context
}

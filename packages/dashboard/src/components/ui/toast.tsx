"use client"

import * as React from "react"
import { X, CheckCircle2, AlertCircle, AlertTriangle, Info } from "lucide-react"
import { cn } from "@/lib/utils"

type ToastVariant = "default" | "success" | "error" | "warning" | "info"

interface Toast {
  id: string
  title: string
  description?: string
  variant?: ToastVariant
  duration?: number
}

interface ToastContextValue {
  toast: (options: Omit<Toast, "id">) => void
  dismiss: (id: string) => void
}

const ToastContext = React.createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([])

  const toast = React.useCallback((options: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).slice(2)
    setToasts((prev) => [...prev, { ...options, id }])
  }, [])

  const dismiss = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider")
  }
  return context
}

function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={() => onDismiss(toast.id)} />
      ))}
    </div>
  )
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const duration = toast.duration ?? 5000

  React.useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onDismiss, duration)
      return () => clearTimeout(timer)
    }
  }, [duration, onDismiss])

  const variantStyles: Record<ToastVariant, string> = {
    default: "bg-background border-border",
    success: "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800",
    error: "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800",
    warning: "bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800",
    info: "bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800",
  }

  const iconMap: Record<ToastVariant, React.ReactNode> = {
    default: null,
    success: <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />,
    error: <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />,
    warning: <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />,
    info: <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />,
  }

  const variant = toast.variant || "default"

  return (
    <div
      className={cn(
        "p-4 rounded-lg border shadow-lg animate-in slide-in-from-right-full duration-200",
        variantStyles[variant]
      )}
      role="alert"
    >
      <div className="flex items-start gap-3">
        {iconMap[variant] && <div className="flex-shrink-0">{iconMap[variant]}</div>}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground">{toast.title}</p>
          {toast.description && (
            <p className="text-sm text-muted-foreground mt-1">{toast.description}</p>
          )}
        </div>
        <button
          onClick={onDismiss}
          className="flex-shrink-0 p-1 text-muted-foreground hover:text-foreground rounded transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

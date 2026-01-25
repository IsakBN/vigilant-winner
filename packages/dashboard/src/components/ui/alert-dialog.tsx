"use client"

import * as React from "react"
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { Button } from "@/components/ui/button"

// ============================================================================
// Standard shadcn/ui AlertDialog Components
// ============================================================================

const AlertDialog = AlertDialogPrimitive.Root

const AlertDialogTrigger = AlertDialogPrimitive.Trigger

const AlertDialogPortal = AlertDialogPrimitive.Portal

const AlertDialogOverlay = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Overlay
    className={cn(
      "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
    ref={ref}
  />
))
AlertDialogOverlay.displayName = AlertDialogPrimitive.Overlay.displayName

const AlertDialogContent = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Content>
>(({ className, ...props }, ref) => (
  <AlertDialogPortal>
    <AlertDialogOverlay />
    <AlertDialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        className
      )}
      {...props}
    />
  </AlertDialogPortal>
))
AlertDialogContent.displayName = AlertDialogPrimitive.Content.displayName

const AlertDialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-2 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
AlertDialogHeader.displayName = "AlertDialogHeader"

const AlertDialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
AlertDialogFooter.displayName = "AlertDialogFooter"

const AlertDialogTitle = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold", className)}
    {...props}
  />
))
AlertDialogTitle.displayName = AlertDialogPrimitive.Title.displayName

const AlertDialogDescription = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
AlertDialogDescription.displayName =
  AlertDialogPrimitive.Description.displayName

const AlertDialogAction = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Action>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Action>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Action
    ref={ref}
    className={cn(buttonVariants(), className)}
    {...props}
  />
))
AlertDialogAction.displayName = AlertDialogPrimitive.Action.displayName

const AlertDialogCancel = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Cancel>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Cancel>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Cancel
    ref={ref}
    className={cn(
      buttonVariants({ variant: "outline" }),
      "mt-2 sm:mt-0",
      className
    )}
    {...props}
  />
))
AlertDialogCancel.displayName = AlertDialogPrimitive.Cancel.displayName

export {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
}

// ============================================================================
// Context-based AlertDialog Provider (for useConfirm hook)
// ============================================================================

interface AlertDialogOptions {
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  variant?: "default" | "destructive"
}

interface AlertDialogContextValue {
  confirm: (options: AlertDialogOptions) => Promise<boolean>
}

const AlertDialogContext = React.createContext<AlertDialogContextValue | null>(null)

interface PendingConfirm extends AlertDialogOptions {
  resolve: (value: boolean) => void
}

export function AlertDialogProvider({ children }: { children: React.ReactNode }) {
  const [pending, setPending] = React.useState<PendingConfirm | null>(null)

  const confirm = React.useCallback((options: AlertDialogOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setPending({ ...options, resolve })
    })
  }, [])

  const handleConfirm = () => {
    pending?.resolve(true)
    setPending(null)
  }

  const handleCancel = () => {
    pending?.resolve(false)
    setPending(null)
  }

  return (
    <AlertDialogContext.Provider value={{ confirm }}>
      {children}
      <DialogPrimitive.Root open={!!pending} onOpenChange={(open) => !open && handleCancel()}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay
            className={cn(
              "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
            )}
          />
          <DialogPrimitive.Content
            className={cn(
              "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg"
            )}
          >
            {pending && (
              <>
                <div className="flex flex-col space-y-2 text-center sm:text-left">
                  <DialogPrimitive.Title className="text-lg font-semibold">
                    {pending.title}
                  </DialogPrimitive.Title>
                  {pending.description && (
                    <DialogPrimitive.Description className="text-sm text-muted-foreground">
                      {pending.description}
                    </DialogPrimitive.Description>
                  )}
                </div>
                <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
                  <Button variant="outline" onClick={handleCancel}>
                    {pending.cancelText || "Cancel"}
                  </Button>
                  <Button
                    variant={pending.variant === "destructive" ? "destructive" : "default"}
                    onClick={handleConfirm}
                  >
                    {pending.confirmText || "Continue"}
                  </Button>
                </div>
              </>
            )}
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </AlertDialogContext.Provider>
  )
}

export function useConfirm() {
  const context = React.useContext(AlertDialogContext)
  if (!context) {
    throw new Error("useConfirm must be used within an AlertDialogProvider")
  }
  return context.confirm
}

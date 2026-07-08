import * as React from "react"
import { AlertDialog as AlertDialogPrimitive } from "@base-ui/react/alert-dialog"
import { AnimatePresence, motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

const AlertDialogContext = React.createContext({ isOpen: false });

function AlertDialog({ open, defaultOpen, onOpenChange, ...props }) {
  const [isOpen, setIsOpen] = React.useState(open ?? defaultOpen ?? false);

  React.useEffect(() => {
    if (open !== undefined) {
      setIsOpen(open);
    }
  }, [open]);

  const handleOpenChange = (nextOpen) => {
    setIsOpen(nextOpen);
    onOpenChange?.(nextOpen);
  };

  return (
    <AlertDialogContext.Provider value={{ isOpen }}>
      <AlertDialogPrimitive.Root open={isOpen} onOpenChange={handleOpenChange} {...props} />
    </AlertDialogContext.Provider>
  );
}

function AlertDialogTrigger(props) {
  return <AlertDialogPrimitive.Trigger data-slot="alert-dialog-trigger" {...props} />;
}

function AlertDialogPortal({ children, ...props }) {
  const { isOpen } = React.useContext(AlertDialogContext);
  return (
    <AnimatePresence>
      {isOpen && (
        <AlertDialogPrimitive.Portal keepMounted {...props}>
          {children}
        </AlertDialogPrimitive.Portal>
      )}
    </AnimatePresence>
  );
}

function AlertDialogBackdrop({ className, ...props }) {
  return (
    <AlertDialogPrimitive.Backdrop
      render={
        <motion.div
          className={cn("fixed inset-0 z-50 bg-black/60 backdrop-blur-xs", className)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          {...props}
        />
      }
    />
  );
}

function AlertDialogPopup({ className, ...props }) {
  return (
    <AlertDialogPrimitive.Popup
      render={
        <motion.div
          className={cn(
            "fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] gap-4 rounded-xl border border-(--border-color) bg-card p-6 shadow-2xl sm:max-w-md focus:outline-none",
            className
          )}
          initial={{ opacity: 0, scale: 0.95, x: "-50%", y: "-48%" }}
          animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }}
          exit={{ opacity: 0, scale: 0.95, x: "-50%", y: "-48%" }}
          transition={{ type: "spring", stiffness: 350, damping: 30 }}
          {...props}
        />
      }
    />
  );
}

function AlertDialogHeader({ className, ...props }) {
  return (
    <div
      data-slot="alert-dialog-header"
      className={cn("flex flex-col gap-1.5 text-center sm:text-left", className)}
      {...props}
    />
  );
}

function AlertDialogFooter({ className, ...props }) {
  return (
    <div
      data-slot="alert-dialog-footer"
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-2.5",
        className
      )}
      {...props}
    />
  );
}

function AlertDialogTitle({ className, ...props }) {
  return (
    <AlertDialogPrimitive.Title
      data-slot="alert-dialog-title"
      className={cn("text-base font-bold text-(--text-primary) font-mono", className)}
      {...props}
    />
  );
}

function AlertDialogDescription({ className, ...props }) {
  return (
    <AlertDialogPrimitive.Description
      data-slot="alert-dialog-description"
      className={cn("text-xs text-(--text-secondary) leading-relaxed", className)}
      {...props}
    />
  );
}

function AlertDialogAction({ className, variant = "default", ...props }) {
  return (
    <AlertDialogPrimitive.Close
      className={cn(buttonVariants({ variant }), "cursor-pointer", className)}
      {...props}
    />
  );
}

function AlertDialogCancel({ className, ...props }) {
  return (
    <AlertDialogPrimitive.Close
      className={cn(buttonVariants({ variant: "outline" }), "cursor-pointer", className)}
      {...props}
    />
  );
}

export {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogPortal,
  AlertDialogBackdrop,
  AlertDialogPopup,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
}

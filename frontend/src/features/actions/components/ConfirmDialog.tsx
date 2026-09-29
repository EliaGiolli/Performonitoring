import { useLayoutEffect, useRef, type ReactNode } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/core/components/ui/alert-dialog';
import { Button, buttonVariants } from '@/core/components/ui/button';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/core/components/ui/drawer';
import { MD_QUERY, useMediaQuery } from '@/core/lib/useMediaQuery';

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  /** Called when the user confirms; the dialog closes right after. */
  onConfirm: () => void;
  /** Paints the confirm button as destructive (data loss, killed programs). */
  destructive?: boolean;
}

/**
 * Asks before a risky action: a centered alert dialog on desktop, a bottom sheet on
 * small screens. Both start with focus on Cancel, so Enter never confirms by accident,
 * and Escape cancels. On close, focus goes back to whatever opened it. The server
 * enforces confirmation too; this is the human half.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  onConfirm,
  destructive = false,
}: ConfirmDialogProps) {
  const isDesktop = useMediaQuery(MD_QUERY);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const variant = destructive ? 'destructive' : 'default';

  // The dialog is opened through `open`, not a Radix Trigger, so Radix has nothing to
  // return focus to and would drop it on <body>. Remember the opener instead. A layout
  // effect runs before Radix moves focus into the dialog (in a passive effect).
  const openerRef = useRef<HTMLElement | null>(null);
  useLayoutEffect(() => {
    if (open && document.activeElement instanceof HTMLElement) openerRef.current = document.activeElement;
  }, [open]);
  const returnFocus = (event: Event) => {
    const opener = openerRef.current;
    // A killed process's row is gone by now; then let Radix fall back to its default.
    if (!opener?.isConnected) return;
    event.preventDefault();
    opener.focus();
  };

  if (isDesktop) {
    return (
      <AlertDialog open={open} onOpenChange={onOpenChange}>
        <AlertDialogContent onCloseAutoFocus={returnFocus}>
          <AlertDialogHeader>
            <AlertDialogTitle>{title}</AlertDialogTitle>
            <AlertDialogDescription>{description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            {/* Not asChild + Button: Slot joins classes without tailwind-merge, so the
                default bg-primary would beat bg-destructive. cn() here merges them. */}
            <AlertDialogAction className={buttonVariants({ variant })} onClick={onConfirm}>
              {confirmLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent
        // A confirmation, not a general dialog: announced as one, like the desktop version.
        role="alertdialog"
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          cancelRef.current?.focus();
        }}
        onCloseAutoFocus={returnFocus}
      >
        <DrawerHeader>
          <DrawerTitle>{title}</DrawerTitle>
          <DrawerDescription>{description}</DrawerDescription>
        </DrawerHeader>
        <DrawerFooter>
          <Button
            variant={variant}
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
          >
            {confirmLabel}
          </Button>
          <DrawerClose asChild>
            <Button ref={cancelRef} variant="outline">
              Cancel
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

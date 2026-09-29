import { useId, useState } from 'react';
import { Button } from '@/core/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/core/components/ui/dialog';

/**
 * Asks for the admin key after the server refused a log change. Submitting hands the
 * key back to retry the change; the caller stores it for this tab.
 */
export function AdminKeyDialog({
  open,
  rejected,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  /** A key was sent and refused, as opposed to none sent yet. */
  rejected: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (key: string) => void;
}) {
  const id = useId();
  const [key, setKey] = useState('');

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setKey('');
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            const trimmed = key.trim();
            if (!trimmed) return;
            setKey('');
            onSubmit(trimmed);
          }}
        >
          <DialogHeader>
            <DialogTitle>Admin key needed</DialogTitle>
            <DialogDescription>
              Archiving and deleting log entries needs the <code>API_SEGRETO</code> value from{' '}
              <code>backend/.env</code>. It is kept in this browser tab only.
            </DialogDescription>
          </DialogHeader>
          {rejected && (
            <p role="alert" className="text-sm">
              That key was not accepted. Check it and try again.
            </p>
          )}
          <div className="grid gap-1.5">
            <label htmlFor={`${id}-key`} className="text-sm font-medium">
              Admin key
            </label>
            <input
              id={`${id}-key`}
              type="password"
              autoComplete="off"
              required
              value={key}
              onChange={(e) => setKey(e.target.value)}
              className="h-11 rounded-md border border-input bg-background px-3 text-sm sm:h-9"
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit">Continue</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

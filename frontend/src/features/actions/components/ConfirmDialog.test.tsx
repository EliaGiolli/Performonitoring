import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { axeViolations } from '@/core/test/axe';
import { ConfirmDialog } from './ConfirmDialog';

function setDesktop(matches: boolean) {
  vi.mocked(window.matchMedia).mockImplementation(
    (query: string) =>
      ({ matches, media: query, addEventListener: vi.fn(), removeEventListener: vi.fn() }) as unknown as MediaQueryList,
  );
}

function Harness({ onConfirm }: { onConfirm: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Kill chrome.exe
      </button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Kill chrome.exe?"
        description="Unsaved work in this program is lost."
        confirmLabel="Kill process"
        onConfirm={onConfirm}
        destructive
      />
    </>
  );
}

const open = () => fireEvent.click(screen.getByRole('button', { name: 'Kill chrome.exe' }));

describe.each([
  ['desktop', true],
  ['mobile', false],
])('ConfirmDialog (%s)', (_label, desktop) => {
  beforeEach(() => setDesktop(desktop));

  it('is a labelled, described alert dialog with focus on Cancel', () => {
    render(<Harness onConfirm={vi.fn()} />);
    open();

    const dialog = screen.getByRole('alertdialog', { name: 'Kill chrome.exe?' });
    expect(dialog).toHaveAccessibleDescription('Unsaved work in this program is lost.');
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus();
  });

  it('runs the action and closes on confirm', () => {
    const onConfirm = vi.fn();
    render(<Harness onConfirm={onConfirm} />);
    open();

    fireEvent.click(screen.getByRole('button', { name: 'Kill process' }));

    expect(onConfirm).toHaveBeenCalledOnce();
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('paints a destructive confirm button, not the primary one', () => {
    render(<Harness onConfirm={vi.fn()} />);
    open();

    const confirm = screen.getByRole('button', { name: 'Kill process' });
    expect(confirm).toHaveClass('bg-destructive');
    expect(confirm).not.toHaveClass('bg-primary');
  });

  it('does nothing on cancel', () => {
    const onConfirm = vi.fn();
    render(<Harness onConfirm={onConfirm} />);
    open();

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('gives focus back to the button that opened it', async () => {
    render(<Harness onConfirm={vi.fn()} />);
    const opener = screen.getByRole('button', { name: 'Kill chrome.exe' });
    opener.focus();
    open();

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    await vi.waitFor(() => expect(opener).toHaveFocus());
  });

  it('has no accessibility violations', async () => {
    render(<Harness onConfirm={vi.fn()} />);
    open();
    expect(await axeViolations(document.body)).toEqual([]);
  });
});

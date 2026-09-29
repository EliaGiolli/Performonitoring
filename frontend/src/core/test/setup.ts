import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { toast } from 'sonner';
import { afterEach, vi } from 'vitest';

// Vitest globals are off, so Testing Library can't register its own cleanup.
afterEach(cleanup);

// Sonner keeps toasts in module state and replays active ones to a new Toaster, so a
// toast from one test would show up in the next. Dismissed toasts are not replayed.
afterEach(() => {
  toast.dismiss();
});

// jsdom has no matchMedia; the theme hook needs it. Tests can override `matches`.
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// jsdom has no ResizeObserver; Recharts' ResponsiveContainer needs one. Charts render
// at zero size in tests, so component tests assert on text, not on SVG geometry.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver ??= ResizeObserverStub;

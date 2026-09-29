import { QueryClientProvider } from '@tanstack/react-query';
import { render, type RenderOptions } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { createQueryClient } from '@/core/api';
import { Toaster } from '@/core/components/ui/sonner';
import { SocketContext } from '@/core/ws/socketContext';
import { FakeSocket } from './fakeSocket';

/**
 * Renders with the app's providers (toaster included), but a fake socket and a fresh query cache. Stub
 * `fetch` in the test to answer the queries the tree makes.
 */
export function renderWithProviders(ui: ReactElement, { socket = new FakeSocket(), ...options }: RenderOptions & { socket?: FakeSocket } = {}) {
  const client = createQueryClient();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>
      <SocketContext value={socket}>{children}</SocketContext>
      <Toaster />
    </QueryClientProvider>
  );
  return { socket, client, ...render(ui, { wrapper, ...options }) };
}

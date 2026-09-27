import { healthResponseSchema, messageResponseSchema } from '@pc-monitor/shared';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { api, ApiError } from './client';

const fetchMock = vi.fn<typeof fetch>();

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json' }, ...init });
}

async function rejection(promise: Promise<unknown>) {
  const err = await promise.then(
    () => null,
    (e: unknown) => e,
  );
  expect(err).toBeInstanceOf(ApiError);
  return err as ApiError;
}

beforeEach(() => vi.stubGlobal('fetch', fetchMock));
afterEach(() => {
  fetchMock.mockReset();
  vi.unstubAllGlobals();
});

describe('api', () => {
  it('GETs under /api with JSON headers and returns the parsed body', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ status: 'ok' }));

    await expect(api.get('/health', healthResponseSchema)).resolves.toEqual({ status: 'ok' });

    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe('/api/health');
    expect(init).toMatchObject({ method: 'GET', headers: { 'Content-Type': 'application/json' } });
    expect(init?.body).toBeUndefined();
  });

  it('sends the body as JSON on mutating calls', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ message: 'done' }));

    await api.post('/processes/1234/kill', { confirm: true }, messageResponseSchema);

    const [, init] = fetchMock.mock.calls[0]!;
    expect(init).toMatchObject({ method: 'POST', body: '{"confirm":true}' });
    expect(init?.headers).toMatchObject({ 'Content-Type': 'application/json' });
  });

  it('throws an ApiError with the server message on an error status', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ status: 'error', message: 'Confirmation required' }, { status: 409 }));

    const err = await rejection(api.post('/processes/1234/kill', {}, messageResponseSchema));
    expect(err.status).toBe(409);
    expect(err.message).toBe('Confirmation required');
  });

  it('falls back to the status text when the error body is not the shared error shape', async () => {
    fetchMock.mockResolvedValue(new Response('<html>oops</html>', { status: 502, statusText: 'Bad Gateway' }));

    const err = await rejection(api.get('/health', healthResponseSchema));
    expect(err.status).toBe(502);
    expect(err.message).toBe('Bad Gateway');
  });

  it('rejects a success response that does not match the schema', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ status: 'maybe' }));

    const err = await rejection(api.get('/health', healthResponseSchema));
    expect(err.status).toBe(0);
    expect(err.message).toContain('Unexpected response');
  });

  it('reports an unreachable backend as status 0', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

    const err = await rejection(api.get('/health', healthResponseSchema));
    expect(err.status).toBe(0);
    expect(err.message).toBe('Backend unreachable');
  });

  it('rethrows aborts untouched so query cancellation is not reported as an error', async () => {
    const controller = new AbortController();
    controller.abort();
    const abort = new DOMException('Aborted', 'AbortError');
    fetchMock.mockRejectedValue(abort);

    await expect(api.get('/health', healthResponseSchema, controller.signal)).rejects.toBe(abort);
  });
});

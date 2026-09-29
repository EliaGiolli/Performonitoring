# Frontend

Live dashboard for PC metrics, processes, fix actions and the activity log.

<p>
  <img src="https://skillicons.dev/icons?i=ts,react,vite,tailwind,vitest" alt="frontend stack" />
</p>

## Stack

- React 19 + Vite, TypeScript (strict)
- Tailwind CSS v4, shadcn/ui on Radix (`cn()` = clsx + tailwind-merge, variants with cva), lucide icons
- TanStack Query for server state, Zustand for live state, `socket.io-client` for the `/ws` stream
- Recharts for the charts, TanStack Table for the process table
- Radix AlertDialog + vaul Drawer for confirmations, Sonner for toasts, react-day-picker (shadcn Calendar) for the log date range
- Vitest + Testing Library + axe-core; Playwright + @axe-core/playwright for the in-browser scan; ESLint with React hooks and strict jsx-a11y rules

Types and runtime validation come from `@pc-monitor/shared`: every REST response and every Socket.IO event is parsed with the shared zod schemas before it reaches the UI.

## Structure

```
src/
├── app/              App, providers, layout shell (header, connection status)
├── core/
│   ├── api/          typed fetch client (/api), TanStack Query client, shared query keys
│   ├── ws/           Socket.IO client, validated subscribe(), connection store
│   ├── theme/        dark/light/system switch
│   ├── components/ui shadcn components
│   └── lib/, test/   cn(), formatters, useMediaQuery; test setup, axe helper, fake socket
└── features/
    ├── metrics/      live charts: CPU, memory, disk, network
    ├── processes/    top-processes table + kill
    ├── actions/      fix actions panel, ConfirmDialog, result toasts
    └── logs/         activity log, archive/delete with the admin key, alert toasts
                      each: components/, hooks/, api.ts, tests
```

## Theme and accessibility

Dark by default, with a light/dark/system switch remembered per browser. Colors are CSS tokens in `src/index.css`: UI tokens with a violet accent, contrast-checked in both modes, and a colorblind-safe chart palette. Status is always shown with an icon and a label, never color alone.

Each chart has a table view (latest readings as text) and a visually hidden summary (now / average / peak) that screen readers read on demand instead of hearing every 2-second tick.

## Live metrics

The socket writes each `snapshot` into a Zustand store outside React (`features/metrics/hooks/useLiveStats.ts`), which keeps a one-hour rolling buffer; each chart subscribes to its own slice. On load the buffer is prefilled from `GET /api/metrics/history`, and the history is fetched again after every reconnect to fill the gap. Alert thresholds come from `GET /api/config/thresholds` and are drawn as dashed reference lines. When the live channel drops, the charts keep the last data, dimmed, under a "Not live" note.

## Processes and fix actions

The process table polls `GET /api/processes` every 5 seconds (listing processes is slow on Windows, so it doesn't follow the 2s ticks). Sorting by CPU or RAM asks the backend for the top 15 by that metric; sorting by name reorders the current list. Below the `md` breakpoint the table becomes a list of cards with its own sort control.

Killing a process and the actions flagged `requiresConfirm` (Empty Recycle Bin) open a confirmation first: a centered alert dialog on desktop, a bottom sheet on mobile, with focus on Cancel. Only confirming sends `{"confirm": true}`; the server refuses the request without it anyway. Every run ends in a toast with the script's one-line result, or the reason it failed or was refused (e.g. a protected PID).

## Activity log

Filters for level, source, active / archived and a day range; pages follow the backend's keyset cursors (Newer / Older), so entries written meanwhile (alerts, runs) never shift a page. The log refreshes after every action run and every `alert` event, and each alert also shows a toast.

Archiving and deleting are admin-only on the server. The key is never built into the page (a key in browser code isn't secret): the first refused change opens a dialog asking for `API_SEGRETO`, keeps it in `sessionStorage` for that tab, and retries. Delete asks for confirmation first; archive can be undone, so it doesn't.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Vite on `http://localhost:5173`, proxying `/api` and `/ws` to the backend (`127.0.0.1:4317`) |
| `npm run build` | type check, then production build to `dist/` |
| `npm test` | Vitest (jsdom) |
| `npm run typecheck` | `tsc --noEmit` for the app and the Vite config |
| `npm run a11y` | axe scan (WCAG 2.2 AA) of the running app with Playwright: desktop and phone, dark and light, with dialogs open; never confirms an action. Uses Playwright's Chromium (`npx playwright install chromium`) or, failing that, an installed Chrome |

Run `npm run dev` from the repo root to start shared, backend and frontend together.

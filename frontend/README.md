# Frontend

Live dashboard for PC metrics, processes, fix actions and logs. The shell is in place (layout, theme, live connection status); the feature panels are *(planned)*.

<p>
  <img src="https://skillicons.dev/icons?i=ts,react,vite,tailwind,vitest" alt="frontend stack" />
</p>

## Stack

- React 19 + Vite, TypeScript (strict)
- Tailwind CSS v4, shadcn/ui on Radix (`cn()` = clsx + tailwind-merge, variants with cva), lucide icons
- TanStack Query for server state, Zustand for live state, `socket.io-client` for the `/ws` stream
- Recharts for the charts *(planned)*
- Vitest + Testing Library + axe-core; ESLint with React hooks and strict jsx-a11y rules

Types and runtime validation come from `@pc-monitor/shared`: every REST response and every Socket.IO event is parsed with the shared zod schemas before it reaches the UI.

## Structure

```
src/
├── app/              App, providers, layout shell (header, connection status)
├── core/
│   ├── api/          typed fetch client (/api) + TanStack Query client
│   ├── ws/           Socket.IO client, validated subscribe(), connection store
│   ├── theme/        dark/light/system switch
│   ├── components/ui shadcn components
│   └── lib/, test/   cn() helper; test setup, axe helper, fake socket
└── features/         metrics, processes, actions, logs (planned)
                      each: components/, hooks/, api.ts, tests
```

## Theme and accessibility

Dark by default, with a light/dark/system switch remembered per browser. Colors are CSS tokens in `src/index.css`: UI tokens with a violet accent, contrast-checked in both modes, and a colorblind-safe chart palette. Status is always shown with an icon and a label, never color alone.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Vite on `http://localhost:5173`, proxying `/api` and `/ws` to the backend (`127.0.0.1:4317`) |
| `npm run build` | type check, then production build to `dist/` |
| `npm test` | Vitest (jsdom) |
| `npm run typecheck` | `tsc --noEmit` for the app and the Vite config |

Run `npm run dev` from the repo root to start shared, backend and frontend together.

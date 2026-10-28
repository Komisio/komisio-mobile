# Komisio Mobile

Mobile app for [Komisio](https://github.com/Komisio/komisio), the consignment
platform for second-hand stores. Built with Expo and React Native.

> Status: app shell. Store picker, login with two-step verification and
> the seller tabs; the tab contents are built next (see `docs/screens.md`).

## Direction

- **Thin client.** The platform (`Komisio/komisio`) is the source of truth.
  The app validates forms and keeps drafts; the server checks permissions,
  agreements, amounts and state changes.
- **Sign-in** with Supabase Auth. **Writes and server flows** go through a
  small mobile API in the platform that reuses the same server functions as the
  web. Direct Supabase reads only for named, reviewed read functions.
- **Screen by screen.** Screens from the earlier app are the design reference;
  the owner decides per screen and function what to keep, change, remove or
  postpone before it is built here. The decisions for version 1 are in
  [`docs/screens.md`](docs/screens.md).
- **Older app versions keep working** for a defined support period, and retried
  commands never create duplicate operations.

## Getting started

Requires Node.js 22.13+, 24.3+ or 26+, as declared in `engines` in
`package.json`. `.nvmrc` selects Node 24 (`nvm use`).

Copy `.env.example` to `.env.local` and point it at a Komisio platform
(local Supabase or staging). Only public client values belong there.

```bash
npm install
npm start          # Expo dev server
npm run typecheck  # TypeScript
npm run lint       # ESLint
npm test           # unit tests (node:test)
```

Routes live in `src/app/`; keep components, hooks and utilities outside it.
See `AGENTS.md` for Expo conventions.

## Licence

Not decided yet. Until a licence is added, no rights are granted beyond
viewing the code.

# Dink or Die

A web-based **roguelite pickleball card battler**. Each rally is a turn-based card
battle: play shots like Dink, Drive, Lob, and Smash to reduce your opponent's
**Balance** to 0 while managing your **Pressure** and **Stamina**. Survive enough
rallies to face **The Pickle King**.

Built with **Vite + React + TypeScript**. Saves use LocalStorage. No backend.

> Status: **Phase 0** — project scaffold, screen navigation, and placeholder
> Title / Main Menu / Settings / Kitchen Counter screens.

## Getting started

Requires Node.js 18+.

```bash
npm install
npm run dev
```

Then open the URL Vite prints (default http://localhost:5173).

## Scripts

| Script            | What it does                              |
| ----------------- | ----------------------------------------- |
| `npm run dev`     | Start the local dev server.               |
| `npm run build`   | Type-check and build to `dist/`.          |
| `npm run preview` | Preview the production build locally.     |
| `npm run deploy`  | Publish `dist/` to GitHub Pages.          |

## Deployment (GitHub Pages)

The Vite `base` is set to `/Pickleball/` for production builds (matching the
`Vashtag/Pickleball` repo — the path is case-sensitive), and `/` in dev. A
GitHub Actions workflow
(`.github/workflows/deploy.yml`) builds and deploys on pushes to `main`.

To enable: in the repo's **Settings → Pages**, set **Source** to **GitHub Actions**.

## Project structure

```txt
src/
├─ components/common/   Shared UI (Button, …)
├─ screens/             Title, Main Menu, Settings, Kitchen Counter, …
├─ styles/              Global CSS theme
├─ App.tsx              Screen-state navigation
└─ main.tsx             Entry point
```

Game data (cards, opponents, courts, paddle mods), the rally engine, and the
save system arrive in later phases.

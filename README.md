# YOH App Academy

Open this folder in your editor and run these commands in its terminal:

```bash
pnpm install
pnpm dev
```

Use Node.js 22.13 or newer and pnpm 11.20.0. If pnpm is missing and Corepack is installed, run `corepack enable` first; the `packageManager` field selects the project's pnpm version.

Open the local address printed in the terminal (usually http://localhost:3000). Press Ctrl+C to stop the server.

The app is inside `yoh-app-academy/`. The commands above work from this outer folder and from the app folder. Previously, running commands here failed because this folder had no `package.json`.

```bash
pnpm typecheck
pnpm build
```

The production build is exported to `yoh-app-academy/out/`. See [the app README](yoh-app-academy/README.md) for source files and feature details.

# PharmaSim

**Educational drug-interaction & pharmacokinetics simulator.** PharmaSim is a fully client-side sandbox for exploring how substances behave in the body and how they interact, built for learning and curiosity.

> ⚠️ **DISCLAIMER — NOT MEDICAL ADVICE**
>
> PharmaSim is an **educational simulation only**. It is **not** a medical device, clinical decision tool, or pharmacological reference. The models are simplified approximations and the data may be incomplete or inaccurate. **Do not** use PharmaSim to make any real-world decision about taking, combining, dosing, or avoiding any substance, medication, or drug. Always consult a qualified healthcare professional. The authors accept no liability for any use of this software.

---

## What it does

- **Substance library** of **351** entries spanning pharmaceuticals, research chemicals, supplements, herbs, and common substances — each tagged with pharmacological properties.
- **Patient profile model** — age, weight, height, body-fat %, tolerance, hydration, and liver / kidney / CYP-metabolizer status drive a clearance model that adjusts pharmacokinetics per individual.
- **Pharmacokinetics engine** — Bateman-function absorption curves, single-dose vs. steady-state daily-dosing superposition, accumulation ratio, effective half-life, and time-to-steady-state, all adjusted by the patient profile.
- **Interaction engine** — rule-based detection of serotonin syndrome, CNS/respiratory depression, CYP inhibition/induction, QT prolongation, bleeding risk, MAOI + sympathomimetic crises, anticholinergic burden, hepatotoxicity, and nephrotoxicity, with severity grading (minor → contraindicated).
- **Body-system impact** summary and **plasma-concentration charts** (Recharts) per substance.

## Tech stack

- **Vite** + **React 18** + **TypeScript** (strict) — 100% client-side, no backend.
- **Tailwind CSS v3** — clinical dark-first design system, teal accent, monospace numerics.
- **lucide-react** — icons. **Recharts** — plasma-concentration visualizations.
- **vite-plugin-pwa** — installable, offline-capable Progressive Web App.
- **Tauri v2** — native desktop builds for Windows, macOS, and Linux.

## Getting started

```bash
npm install
npm run dev        # start the Vite dev server at http://localhost:5173
```

### Scripts

| Script              | Description                                   |
| ------------------- | --------------------------------------------- |
| `npm run dev`       | Start the Vite dev server (port 5173).        |
| `npm run build`     | Type-check (`tsc -b`) and build to `dist/`.   |
| `npm run preview`   | Preview the production build locally.         |
| `npm run typecheck` | Type-check only (`tsc --noEmit`).             |
| `npm run tauri:dev` | Run the Tauri desktop app in dev mode.        |
| `npm run tauri:build` | Build native desktop bundles.               |

## Build targets

### 1. Static web app

```bash
npm run build
```

The build emits a fully static site to `dist/` — host it on any static file server (GitHub Pages, Netlify, S3, Cloudflare Pages, etc.). The Vite `base` is set to `./` so it works from any sub-path.

### 2. Progressive Web App (PWA)

The production build (`npm run build`) generates a web manifest and a service worker (via `vite-plugin-pwa`, auto-update). Serving `dist/` over HTTPS makes PharmaSim **installable** and **offline-capable** — install it from a supported browser's address bar or "Add to Home Screen".

### 3. Tauri v2 desktop (Windows / macOS / Linux)

PharmaSim ships a Tauri v2 configuration in `src-tauri/`. Building native bundles requires the Rust toolchain and each platform's native prerequisites.

**Prerequisites (all platforms):**

- [Rust](https://www.rust-lang.org/tools/install) (stable, ≥ 1.77.2) and Cargo.
- Node.js ≥ 18 and the project dependencies (`npm install`).

**Platform-specific prerequisites:**

- **Windows** — Microsoft C++ Build Tools and the WebView2 runtime (preinstalled on Windows 11).
- **macOS** — Xcode Command Line Tools (`xcode-select --install`).
- **Linux** — `webkit2gtk`, `libappindicator`, `librsvg`, and related dev packages (see the [Tauri Linux prerequisites](https://tauri.app/start/prerequisites/)).

**Develop and build:**

```bash
npm run tauri:dev      # launch the desktop app against the dev server
npm run tauri:build    # produce native installers/bundles in src-tauri/target/release/bundle/
```

The desktop build runs `npm run build` first (configured via `beforeBuildCommand`) and packages the static `dist/` output into a native window.

## Project structure

```
pharmasim/
├── public/icons/          # PWA icons + SVG logo
├── src/
│   ├── data/              # substance database (351) + type definitions
│   ├── lib/               # pharmacokinetics + interactions engines, app state
│   ├── components/        # PatientPanel, SubstanceSearch, SubstanceCard, ResultsPanel, …
│   ├── App.tsx
│   └── main.tsx
├── src-tauri/             # Tauri v2 desktop config + Rust source + icons
├── .github/workflows/     # CI (typecheck + build) and release (tauri-action)
└── dist/                  # production build output (generated)
```

## License

[MIT](./LICENSE) © 2026 KoshkiKode LLC (Dylan Moore).

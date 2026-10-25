# PharmaSim

**Educational drug-interaction & pharmacokinetics simulator.** PharmaSim is a fully client-side sandbox for exploring how substances behave in the body and how they interact, built for learning and curiosity.

> ⚠️ **IMPORTANT — EDUCATIONAL SOFTWARE ONLY / NOT HEALTH OR MEDICAL ADVICE**
>
> PharmaSim is a client-side educational simulation and software project. It is **not** a medical device, clinical decision tool, diagnostic tool, treatment tool, prescribing aid, or pharmacological reference. The models are simplified approximations and the data may be incomplete, outdated, or inaccurate. **Do not** use PharmaSim to make any real-world decision about taking, combining, dosing, stopping, or avoiding any substance, medication, or drug, and do not treat a result, warning, or “low-risk” example as a safety recommendation. For personal health questions, medication decisions, suspected poisoning, or emergencies, contact a qualified healthcare professional or appropriate emergency/poison-control service. Do not enter identifiable health information. The authors accept no liability for use of this software.

---

## What it does

- **Substance library** of **880+** entries spanning pharmaceuticals, research chemicals, supplements, herbs, and common substances — each tagged with pharmacological properties.
- **Patient profile model** — age, weight, height, body-fat %, tolerance, hydration, and liver / kidney / CYP-metabolizer status drive a clearance model that adjusts pharmacokinetics per individual.
- **Pharmacokinetics engine** — Bateman-function absorption curves, single-dose vs. steady-state daily-dosing superposition, accumulation ratio, effective half-life, and time-to-steady-state, all adjusted by the patient profile.
- **Interaction engine** — rule-based detection of serotonin syndrome, CNS/respiratory depression, CYP inhibition/induction, QT prolongation, bleeding risk, MAOI + sympathomimetic crises, anticholinergic burden, hepatotoxicity, and nephrotoxicity, with modeled severity grading (minor → contraindicated).
- **Body-system impact** summary and **plasma-concentration charts** (Recharts) per substance.
- **Runtime safeguards** — shared validation and sanitization for patient profiles,
  regimens, custom events, advanced substance fields, and persisted local state.

Every patient profile, dose, condition, interaction, warning, and report in the app is a **simulation input or estimate only**. Labels such as “patient,” “clinical,” “contraindication,” and “dose” describe the simulation domain and do not imply that PharmaSim provides healthcare, medical validation, or individualized recommendations.

## Tech stack

- **Vite** + **React 19** + **TypeScript** (strict) — 100% client-side, no backend.
- **Tailwind CSS v4** — clinical dark-first design system, teal accent, monospace numerics.
- **lucide-react** — icons. **Recharts** — plasma-concentration visualizations.
- **vite-plugin-pwa** — installable, offline-capable Progressive Web App.
- **Tauri v2** — native builds for Windows, macOS, and Linux. The separate
  `apps/mobile` React Native CLI client targets Android and iOS;
  `apps/DesktopNative` targets React Native macOS. Windows desktop bundles use
  the Tauri app.
- **Vitest** — unit tests for the PK engine, interaction engine, and substance-database validation.

Dependencies are pinned through the root workspace lockfile; platform-native dependencies are intentionally kept on their platform-matched release lines. Run the validation commands below after changing them.

## Getting started

```bash
npm install
npm run dev        # start the React Native Metro server
```

To run the Linux desktop / web client instead:

```bash
npm run dev -w apps/linux-desktop   # start the Vite dev server at http://localhost:5173
```

PharmaSim is not health advice. Read the safety notice above before using the app, and use only fictional or non-identifying data.

See [the roadmap](docs/roadmap.md) for the current capability boundary,
robustness priorities, and the safety gate for future pill identification.

### Scripts

| Script              | Description                                   |
| ------------------- | --------------------------------------------- |
| `npm run dev`       | Start the React Native Metro server.          |
| `npm run build`     | Build the shared engine package.              |
| `npm run typecheck` | Type-check engine, mobile, and Linux desktop. |
| `npm test`          | Run engine and Linux desktop tests.           |
| `npm run desktop:linux` | Build the Linux Tauri bundle.             |
| `npm run mobile`    | Start the React Native Metro server.          |
| `npm run bench`     | Run engine benchmark cases.                  |
| `npm run test:stress` | Run engine stress/property tests.          |

## Build targets

### 1. Static web app / Linux desktop client

```bash
npm run build -w apps/linux-desktop
```

The build emits a fully static site to `apps/linux-desktop/dist/` — host it on
any static file server (Firebase Hosting / Google Cloud, GitHub Pages,
Cloudflare Pages, etc.).

### 2. Progressive Web App (PWA)

The production build generates a web manifest and service worker via
`vite-plugin-pwa`. Serving `apps/linux-desktop/dist/` over HTTPS makes PharmaSim
**installable** and **offline-capable**.

### 3. Tauri v2 desktop (Windows / macOS / Linux)

PharmaSim ships a Tauri v2 configuration in `apps/linux-desktop/src-tauri/`. Building native bundles requires the Rust toolchain and each platform's native prerequisites.

**Prerequisites (all platforms):**

- [Rust](https://www.rust-lang.org/tools/install) (stable, ≥ 1.77.2) and Cargo.
- Node.js ≥ 18 and the project dependencies (`npm install`).

**Platform-specific prerequisites:**

- **Windows** — Microsoft C++ Build Tools and the WebView2 runtime (preinstalled on Windows 11).
- **macOS** — Xcode Command Line Tools (`xcode-select --install`).
- **Linux** — `webkit2gtk`, `libappindicator`, `librsvg`, and related dev packages (see the [Tauri Linux prerequisites](https://tauri.app/start/prerequisites/)).

**Develop and build:**

```bash
npm run tauri:dev -w apps/linux-desktop      # launch the desktop app
npm run tauri:build -w apps/linux-desktop    # produce native installers/bundles
```

The desktop build runs `npm run build` first (configured via `beforeBuildCommand`) and packages the static `dist/` output into a native window.

### 4. React Native mobile client (Android / iOS)

The mobile client lives in `apps/mobile` and uses the React Native CLI. Start
Metro, then launch a platform from another terminal:

```bash
npm run mobile
npm run android -w apps/mobile
npm run ios -w apps/mobile
```

Android builds require the Android SDK and Java 17. iOS builds require macOS,
Xcode, and CocoaPods. Native project files are in `apps/mobile/native`.

## Project structure

```
pharmasim/
├── packages/engine/       # shared PK, interaction, toxicity, state, and validation engine
├── apps/linux-desktop/    # Vite + React + Tailwind + Tauri desktop/PWA client
├── apps/mobile/           # React Native CLI client for Android and iOS
├── apps/DesktopNative/    # React Native desktop client for macOS
├── docs/adding-substances.md  # how to add chemicals/substances safely
├── docs/roadmap.md        # capability boundary and prioritized backlog
├── .github/workflows/     # CI, cross-platform native builds, and tagged release workflows
```

## License

[MIT](./LICENSE) © 2026 KoshkiKode LLC (Dylan Moore).

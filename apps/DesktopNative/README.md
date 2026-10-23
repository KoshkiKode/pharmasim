# PharmaSim DesktopNative

This directory contains the React Native macOS/Windows client for PharmaSim.
The shared simulation engine lives in [`packages/engine`](../../packages/engine).

> **Educational software only:** PharmaSim is not health or medical advice, a
> diagnostic or treatment tool, a prescribing aid, or a dosing guide. Results,
> warnings, and demo combinations are simplified estimates. Never use the app
> for real-world drug, medication, treatment, or emergency decisions. Use
> fictional or non-identifying data during development.

## Development

Install from the repository root so the workspace engine resolves locally:

```bash
npm install
```

Start Metro:

```bash
npm run start -w apps/DesktopNative
```

Run the native target after completing the [React Native environment
setup](https://reactnative.dev/docs/environment-setup):

```bash
npm run ios -w apps/DesktopNative
npm run windows -w apps/DesktopNative
```

Run the smoke test:

```bash
npm test -w apps/DesktopNative
```

## Scope and current limitations

DesktopNative uses the shared engine, but it is not a clinical application and
does not provide medical advice, diagnosis, prescribing, dosing, or emergency
guidance. Use only fictional or non-identifying data. The current project does
not include pill identification, camera/OCR recognition, barcode lookup, cloud
sync, or production licensing; those are separate roadmap items with additional
safety and privacy requirements.

For the repository-wide backlog and validation commands, see
[`docs/roadmap.md`](../../docs/roadmap.md) and
[`.agents/task.md`](../../.agents/task.md).

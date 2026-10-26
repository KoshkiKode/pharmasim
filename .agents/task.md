# PharmaSim project backlog

This file tracks repository-level work. Completed infrastructure work remains
checked for historical context; active work is grouped by the current
robustness roadmap.

## Completed

- `[x]` Restore and rename the Linux desktop target to `apps/linux-desktop`.
- `[x]` Configure Tauri Linux bundles and the root build scripts.
- `[x]` Refresh workspace dependencies, CI actions, and safety disclosures.
- `[x]` Add shared runtime validation for patient profiles and regimens.
- `[x]` Harden versioned local persistence and bound restored collections.
- `[x]` Expand substance validation to advanced PK, toxicity, mixture,
  metabolite, and receptor fields.
- `[x]` Document the current capability boundary and pill-identification design
  gate in [`docs/roadmap.md`](../docs/roadmap.md).
- `[x]` Extract the byte-identical `apps/mobile/src` and
  `apps/DesktopNative/src` copies into the shared `@pharmasim/ui` package.
- `[x]` Replace duplicated report generation and alert formatting in web,
  mobile, and DesktopNative with shared engine/report helpers
  (`packages/engine/src/lib/report.ts`), including qualified toxicity wording.
- `[x]` Add optional field-level parameter evidence, canonical unit validation,
  mixture/metabolite reference checks, and a non-fatal PK consistency audit.
- `[x]` Add configurable route absorption/lag, release windows, IV infusion events,
  finite-horizon AUC, peak timing, and model diagnostics.
- `[x]` Surface model limitations, evidence gaps, and incomplete interaction
  coverage in shared reports and client results.

## Next
- `[ ]` Reframe modeled outputs so “safe”, “contraindicated”, “discontinue”,
  and similar terms cannot be mistaken for clinical instructions.
- `[ ]` Backfill source/review metadata across legacy substance fields and add
  evidence metadata to individual interaction rules/results.
- `[ ]` Continue reviewed substance batches and introduce coupled metabolite,
  two-compartment, and nonlinear models only after reference validation.
- `[ ]` Add end-to-end, accessibility, and corrupted-storage coverage for each
  client.
- `[ ]` Replace the demo-only usage unlock with a server-verified entitlement
  flow before offering paid features.
- `[ ]` Design and safety-review pill identification before adding camera, OCR,
  barcode, or image-recognition capabilities. See [`docs/roadmap.md`](../docs/roadmap.md).

## Verification

Run from the repository root:

```bash
npm run typecheck
npm test
npm test -w apps/DesktopNative -- --runInBand
```

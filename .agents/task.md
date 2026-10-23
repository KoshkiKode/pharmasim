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

## Next

- `[ ]` Replace duplicated report generation and alert formatting in web,
  mobile, and DesktopNative with shared engine/report helpers.
- `[ ]` Reframe modeled outputs so “safe”, “contraindicated”, “discontinue”,
  and similar terms cannot be mistaken for clinical instructions.
- `[ ]` Add evidence quality, provenance, approximation, and review-date
  metadata to substance and interaction results.
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

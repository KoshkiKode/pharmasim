# PharmaSim roadmap

**Last reviewed:** 2026-10-22

PharmaSim is an educational simulator, not a diagnostic, prescribing, treatment,
or emergency-response tool. The roadmap below separates improvements that can
make the simulator more reliable from future features that require a much
higher safety bar.

## Current capabilities

- Shared pharmacokinetic event simulation across the web/Tauri, mobile, and
  DesktopNative clients.
- Rule-based drug-drug, drug-condition, body-system, receptor, and modeled
  toxicity outputs.
- A large local substance dataset with validation for core and advanced fields.
- Local-only session and usage storage. No account, cloud sync, or remote
  health-data service is currently provided.
- Three client surfaces: Linux desktop/PWA/Tauri, Expo mobile, and
  React Native DesktopNative. Feature parity is not yet complete.

## Near-term robustness work

1. Replace duplicated report and alert formatting in each client with a shared
   report model.
2. Add evidence-quality, approximation, provenance, and review-date metadata to
   substance and interaction results.
3. Reword modeled outputs so labels such as “safe”, “contraindicated”, and
   “discontinue” cannot be mistaken for clinical decisions.
4. Add end-to-end, accessibility, and corrupted-storage tests for each client.
5. Replace the demo-only usage unlock with a real server-verified entitlement
   flow before offering paid features. The local usage tracker is not security.

The active checklist for this work is maintained in
[`.agents/task.md`](../.agents/task.md). Before submitting a change, run the
repository verification commands listed there.

## Pill-identification design gate

Pill identification is **not implemented**. It must remain a separate subsystem
from the PK simulator and must never silently turn an image into an ingestion
recommendation.

Before implementation, the subsystem needs:

- Explicit imprint, shape, color, dosage form, and jurisdiction inputs.
- Ranked candidates with confidence, missing-attribute explanations, and a
  definitive “cannot identify” result.
- Authoritative or licensed reference data with provenance and update dates.
- Local-by-default image processing and no retention of identifiable images.
- A prominent instruction not to take an unidentified pill and a handoff to
  local poison-control or emergency services for suspected exposure.
- Tests for look-alikes, partial images, counterfeit/unknown products, and
  conflicting attributes.

Camera capture, OCR, barcode scanning, or an ML model should not be added until
those contracts, data licenses, privacy behavior, and safety review are in
place.

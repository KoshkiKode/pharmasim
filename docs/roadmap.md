# PharmaSim roadmap

**Last reviewed:** 2026-10-25

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
- Shared input sanitization, versioned local-session recovery, and shared report
  generation and toxicity labels across clients.
- Local-only session and usage storage. No account, cloud sync, or remote
  health-data service is currently provided.
- Three client surfaces: Linux desktop/PWA/Tauri, React Native CLI mobile, and
  React Native DesktopNative. Feature parity is not yet complete.

## Recent-change passthrough

The completed-work checklist already records shared UI extraction, runtime
validation, persistence hardening, advanced substance validation, and shared
reports. These are implemented foundations, not future roadmap items. Recent
native-platform work also updated the iOS scene delegate and Tauri release
configuration; these packaging changes do not establish model accuracy or
cross-platform feature parity.

## Model boundary and assumptions

- The default model is linear, one-compartment PK with first-order elimination.
  Doses superpose; concentration is total modeled plasma concentration in mg/L,
  not a measured value or a free-drug/effect-site concentration.
- Clearance, when supplied, determines base half-life from distribution volume
  and clearance. Otherwise the supplied half-life is used. Conflicting source
  values need review rather than silent reconciliation.
- Generic route absorption and bioavailability scalars remain fallbacks.
  ER/XR/CR fall back to representative 8/12/24-hour zero-order release windows
  followed by first-order absorption, not product-specific release curves.
- Substance-specific route absorption/lag and formulation release windows are
  optional overrides. IV infusion duration is an event-level input; IV events
  without it retain bolus behavior.
- AUC is modeled exposure only over the reported simulation horizon, not AUC to
  infinity. Curves are bounded to 30 days; truncated events or elimination tails
  must be disclosed. Peak timing and troughs are estimates, not dosing targets.
- Metabolite formation remains a simplified parent-elimination-rate
  approximation. It does not constitute a coupled, mass-balanced parent–metabolite
  model accounting for absorption, first-pass metabolism, and molecular mass.
- Field-level evidence metadata distinguishes measured, estimated, and unknown
  parameters. Legacy entries without metadata remain unreviewed; a populated
  numeric field or `approximate: false` is not evidence of verification.
- Interaction detection is tag/rule-based and incomplete. No detected interaction
  does not mean no risk, and missing toxicity/receptor data must not imply safety.

## Implemented robustness additions

- Field-level evidence contracts, units and source/review-date validation.
- Mixture/metabolite reference checks and a non-fatal clearance/volume/half-life
  consistency audit, separate from structural database validation.
- Reviewed substance additions with parameter-level sources, numerical PK
  regressions, and additional malformed-storage coverage.
- The first reviewed batch fills missing levocetirizine, ketoprofen, and oxaprozin
  entries using DailyMed labels. Assumed absolute bioavailability and converted
  apparent distribution volumes are explicitly labeled estimates, not silently
  promoted to measurements. Oxaprozin remains a linear approximation despite
  known nonlinear behavior; this batch does not add a nonlinear solver.
- Explicit model diagnostics and finite-horizon PK metrics in shared reporting
  and client results.

## Partial coverage and next stages

1. Backfill provenance across the legacy library in reviewed batches, prioritizing
   common pharmaceuticals, OTC substances, supplements, and active metabolites.
   Keep estimated defaults distinct from measured values. Migrate the legacy
   unchecked raw catalog to typed records as entries are reviewed; runtime
   validation remains mandatory in the meantime.
2. Extend evidence metadata to individual interaction rules/results; substance
   parameter provenance alone does not validate interaction severity.
3. Reword remaining modeled outputs so labels such as “safe”, “contraindicated”, and
   “discontinue” cannot be mistaken for clinical decisions.
4. Add end-to-end and accessibility coverage for every client, including native
   storage adapters and rendering of diagnostic states. Shared engine tests do
   not replace device-level coverage.
5. Replace the demo-only usage unlock with a real server-verified entitlement
   flow before offering paid features. The local usage tracker is not security.
6. Introduce coupled parent–metabolite kinetics, optional two-compartment models,
   and nonlinear elimination only with sourced parameters, analytical/reference
   comparisons, runtime bounds, and explicit model selection. They are not
   implemented by supplying extra scalar fields.

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

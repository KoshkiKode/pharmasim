# Adding substances & chemicals

The substance library is plain, type-checked TypeScript data. Adding an entry
requires source review as well as validation: types and runtime checks establish
data shape, not scientific accuracy. Interaction rules consider the tags and
enzyme fields provided; they do not establish complete interaction coverage.

> **Safety boundary:** This repository models substances for educational
> software only. It is not health or medical advice, and entries must not be
> presented as dosing, treatment, prescribing, or “safe use” guidance. Values
> may be estimated, incomplete, or wrong. Use fictional/non-identifying data
> when developing and ask a qualified professional about real-world health
> decisions.

## 1. Append an entry

Add an object to the `substances` array in
[`src/data/substances.ts`](../packages/engine/src/data/substances.ts):

```ts
{
  id: "methylphenidate",                 // unique, lowercase, hyphenated
  name: "Methylphenidate",               // generic name
  brandNames: ["Ritalin", "Concerta"],   // [] if none
  category: "pharmaceutical",            // see SubstanceCategory
  drugClass: "CNS stimulant",
  halfLifeHours: 3,                      // elimination half-life (> 0)
  typicalDoseMg: 20,                     // optional
  doseRangeMg: [5, 60],                  // optional, [min, max]
  routes: ["oral"],                      // see ROUTES
  cypMetabolism: ["plasma esterases"],   // optional — CYPs or other enzymes
  mechanism: "Dopamine/norepinephrine reuptake inhibition.",
  bodySystems: ["CNS", "Cardiovascular"],// see BODY_SYSTEMS
  warnings: ["Lowers seizure threshold"],// optional
  tags: ["stimulant", "sympathomimetic", "dopaminergic"], // optional
  approximate: false,                    // true if PK values are estimates
},
```

The abbreviated example above shows core descriptive fields, not a complete
reviewed entry. Also supply required `bioavailability` (fraction) and `vdLKg`
(L/kg), and field-level evidence for new PK values. Do not copy its illustrative
dose values as recommendations.

The full field reference lives in
[`src/data/types.ts`](../packages/engine/src/data/types.ts).

## 2. Use the canonical vocabularies

These fields are **typed unions** — your editor will autocomplete them and the
build (`tsc -b`) fails on a typo:

- **`category`** — one of `SUBSTANCE_CATEGORIES`.
- **`routes`** — values from `ROUTES` (`oral`, `IV`, `intranasal`, …).
- **`bodySystems`** — values from `BODY_SYSTEMS` (`CNS`, `Hepatic`, …). To
  introduce a brand-new system, add it to `BODY_SYSTEMS` in `types.ts` first.
- **`tags`** — values from `SubstanceTag`. **This is how interactions work:** the
  rule engine in [`src/lib/interactions.ts`](../packages/engine/src/lib/interactions.ts) reasons
  over these tags plus the CYP fields. Tag a substance `serotonergic` and it is
  immediately considered by the serotonin-syndrome rule against every other
  serotonergic agent — no per-pair data needed.

`cypMetabolism` / `cypInhibits` / `cypInduces` are free strings so non-CYP
clearance pathways (`MAO`, `alcohol dehydrogenase`) are expressible. The engine
matches an inhibitor/inducer to a substrate by exact string, so keep enzyme
names consistent (prefer `CYP3A4`, `CYP2D6`, … spelling already used elsewhere).

## 3. Validate

```bash
npm run typecheck   # tsc -b — catches union/shape errors
npm test            # runs the validation + engine test suites
```

The test suite runs [`validateSubstances`](../packages/engine/src/data/validate.ts) over the
whole library and fails on duplicate or malformed ids, inverted dose ranges, a
`typicalDoseMg` outside `doseRangeMg`, non-finite or invalid advanced PK values,
invalid route bioavailability, malformed toxicity thresholds, invalid mixture
ratios, malformed metabolite metadata, invalid receptor affinities, a
non-positive half-life, or empty `routes` / `bodySystems`. In dev (`npm run dev`)
the same check runs on load and throws with a readable summary, so a bad entry
surfaces immediately.

When a profile or regimen comes from a UI or persisted JSON, use the shared
runtime helpers in [`src/lib/validation.ts`](../packages/engine/src/lib/validation.ts)
instead of trusting the object shape. They bound numeric values, filter unknown
conditions and phenotypes, limit custom events, and restore only known
substances.

> Substances not dosed in milligrams (e.g. inhaled gases) may use `0` for
> `typicalDoseMg` / `doseRangeMg`.

## 4. Adding a new interaction rule (optional)

To model a new pharmacodynamic interaction, add a `SubstanceTag` in `types.ts`,
tag the relevant substances, and append a `Rule` to `RULES` in
`interactions.ts`. Each rule is a pure `(a, b) => Interaction | null` function;
both orderings are evaluated and results are de-duplicated and severity-sorted.
Add a test in `src/lib/interactions.test.ts`.

## 5. Evidence and PK review

For new or revised entries, use authoritative product labels or primary
literature. Record `parameterEvidence` separately for each supported parameter:
source URL and title, review date (`YYYY-MM-DD`), evidence quality
(`high`, `moderate`, `low`), basis (`measured`, `estimated`, `unknown`), unit,
and any conversion or population assumptions in `notes`. A source URL is not
proof that every parameter in an entry appears in that source.

Canonical units are `h` for half-life/release windows, `fraction` for
bioavailability and metabolite conversion, `L/kg` for distribution volume,
`mL/min/kg` for clearance, `%` for protein binding, `g/mol` for molecular mass,
`1/h` for absorption-rate records, and `unitless` for tags. Preserve source
units in notes when converting. Missing metadata means unreviewed, not measured;
unknown data must not be disguised as a sourced generic constant.

Optional `absorptionByRoute` records contain `kaPerHour` and `lagHours`.
`releaseHoursByFormulation` supplies substance-specific release durations in
hours, not arbitrary release shapes. Without overrides, generic route and
ER/XR/CR assumptions remain active and are disclosed in results. These fields
do not implement two-compartment or nonlinear kinetics.

For event timelines, optional `infusionDurationHours` must be positive and finite,
and is accepted only for IV events without a `kaOverride`. Omitting it retains
bolus behavior. Invalid infusion events are rejected rather than silently
converted to boluses. This is an engine/custom-event contract; it does not imply
every client has an infusion-duration editor.

Run `auditSubstanceConsistency` when reviewing entries with clearance:
one-compartment half-life is approximately `ln(2) × Vd / CL` after unit
conversion. This audit is deliberately non-fatal for legacy entries and flags
discrepancies for human review; do not overwrite literature values simply to
silence an audit. Mixture and metabolite references must resolve to existing
entries. Add source-metadata, interaction-tag, and numerical regression tests
for each reviewed batch.

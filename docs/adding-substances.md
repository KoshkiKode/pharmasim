# Adding substances & chemicals

The substance library is plain, type-checked TypeScript data. Adding a new
chemical is a one-line append — the type system and a validation pass enforce
correctness, and the interaction engine wires the new entry into every relevant
rule automatically based on its tags.

## 1. Append an entry

Add an object to the `substances` array in
[`src/data/substances.ts`](../src/data/substances.ts):

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

The full field reference lives in
[`src/data/types.ts`](../src/data/types.ts).

## 2. Use the canonical vocabularies

These fields are **typed unions** — your editor will autocomplete them and the
build (`tsc -b`) fails on a typo:

- **`category`** — one of `SUBSTANCE_CATEGORIES`.
- **`routes`** — values from `ROUTES` (`oral`, `IV`, `intranasal`, …).
- **`bodySystems`** — values from `BODY_SYSTEMS` (`CNS`, `Hepatic`, …). To
  introduce a brand-new system, add it to `BODY_SYSTEMS` in `types.ts` first.
- **`tags`** — values from `SubstanceTag`. **This is how interactions work:** the
  rule engine in [`src/lib/interactions.ts`](../src/lib/interactions.ts) reasons
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

The test suite runs [`validateSubstances`](../src/data/validate.ts) over the
whole library and fails on: duplicate or malformed ids, inverted dose ranges, a
`typicalDoseMg` outside `doseRangeMg`, a non-positive half-life, or empty
`routes` / `bodySystems`. In dev (`npm run dev`) the same check runs on load and
throws with a readable summary, so a bad entry surfaces immediately.

> Substances not dosed in milligrams (e.g. inhaled gases) may use `0` for
> `typicalDoseMg` / `doseRangeMg`.

## 4. Adding a new interaction rule (optional)

To model a new pharmacodynamic interaction, add a `SubstanceTag` in `types.ts`,
tag the relevant substances, and append a `Rule` to `RULES` in
`interactions.ts`. Each rule is a pure `(a, b) => Interaction | null` function;
both orderings are evaluated and results are de-duplicated and severity-sorted.
Add a test in `src/lib/interactions.test.ts`.

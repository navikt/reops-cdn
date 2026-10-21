---
name: reops-add-tracking
description: Add Innblikk/ReOps analytics tracking to a React app using Nav's event taxonomy (@navikt/analytics-types). Scans the codebase for Aksel component usage, matches components to taxonomy events, and wires window.sporing.track() calls with type-safe properties. Use when the user says "add tracking", "legg til sporing", "instrument", or wants to start sending analytics events from an app to Innblikk.
---

# Add tracking to app (Innblikk event taxonomy)

Goal: instrument a React codebase with Nav's shared event taxonomy so events flow into Innblikk (BigQuery).

Canonical taxonomy source: https://github.com/navikt/analytics-types
Machine-readable event list: https://github.com/navikt/analytics-types/releases/latest/download/events.json

## Prerequisites check (do first, report findings)

1. Tracking script installed? Search HTML/root layout for the sporing script tag:
   ```
   rg -l "cdn.nav.no/team-researchops/sporing" --glob '!node_modules'
   ```
   If missing → tell user to add it (see https://reops-docs.ansatt.dev.nav.no/ or Innblikk forsiden `/public`), don't invent the website UUID.
2. **Gotcha — script id shadowing:** if the script tag has `id="sporing"`, `window.sporing` resolves to the DOM element and the real API never installs (pageviews work, manual `.track()` silently no-ops). The tag must NOT have `id="sporing"` or `id="umami"`. Fix the id if found.
3. Site built with `@navikt/ds-react` (Aksel)? Check package.json. Taxonomy's component events assume Aksel; non-Aksel UIs use the generic events (`navigere`, `skjema *`, `filtervalg`, `last ned`, `besøk`).

## Step 1 — Fetch the current taxonomy

Fetch https://github.com/navikt/analytics-types/releases/latest/download/events.json
(public, no auth; fall back to reading `node_modules/@navikt/analytics-types/dist/esm/events/**/*.d.ts` if offline).

Each event: `{ name, constantName, propertiesType, description, category, source, properties: [{ name, type, optional, description, inherited? }] }`.

- `category` `events/aksel/<component>/` → tied to Aksel component `<component>`.
- `category` `events/{skjema,navigere,filtervalg,besok,last-ned}` → generic, wire wherever the app has that user action.
- `inherited: true` properties come from BaseProperties (kontekst, komponentId, målgruppe, seksjon, innholdstype, opprinnelse) — always allowed, fill when known.

## Step 2 — Scan the repo for trackable components

Build the Aksel-component → events map from the taxonomy (65+ events over ~35 components), then scan:

```bash
# All Aksel imports with local names (handles aliasing: `import { Accordion as A }`)
rg -n --no-heading 'import\s*\{[^}]*\}\s*from\s*["'"'"']@navikt/ds-react["'"'"']' --glob '!node_modules' -g '*.{ts,tsx,js,jsx}'
```

For each imported component present in the taxonomy map, find usage sites:

```bash
rg -n --no-heading '<(Accordion|Modal|Tabs|...)' --glob '!node_modules' -g '*.{tsx,jsx}'
```

Produce a checklist: component × file:line × candidate events. Present it to the user before editing — they decide scope (all, or subset). Multi-line imports: search per-component too (`rg -n '\bAccordion\b' --type ts`) if the single-line pattern misses.

Component-name mapping notes (taxonomy dir → ds-react name): `expansion-card` → `ExpansionCard`, `read-more` → `ReadMore`, `link-card` → `LinkCard`, `copy-button` → `CopyButton`, `button` → `Button`, `link` → `Link`, `search` → `Search`, `table` → `Table`, `tag` → `Tag`, `chips` → `Chips`, `textarea` → `Textarea`, `textfield` → `TextField`, `datepicker` → `DatePicker`, `monthpicker` → `MonthPicker`, `pagination` → `Pagination`, `stepper` → `Stepper`, `formprogress` → `FormProgress`, `formsummary` → `FormSummary`, `errorsummary` → `ErrorSummary`, `guidepanel` → `GuidePanel`, `infocard` → `InfoCard`, `helptext` → `HelpText`, `actionmenu` → `ActionMenu`, `togglegroup` → `ToggleGroup`, `file-upload` → `FileUpload`, `globalalert` → `GlobalAlert`, `localalert` → `LocalAlert`, `inlinemessage` → `InlineMessage`, others are identity (Accordion, Modal, Alert, Tabs, Checkbox, Radio, Select, Switch, Tooltip, Popover, Combobox, Process).

## Step 3 — Wire tracking

If the app uses TypeScript, recommend the package for type safety:

```bash
pnpm add @navikt/analytics-types   # GitHub Packages registry, needs @navikt scope auth
```

Pattern per event (minimal, no framework wrapper needed):

```tsx
import { Events, type AccordionApnetProperties } from '@navikt/analytics-types'

<Accordion.Item onOpenChange={(open) => {
  if (open) {
    const props: AccordionApnetProperties = { tittel: 'Om stønaden' }
    window.sporing?.track(Events.ACCORDION_APNET, props)
  }
}}>
```

Rules:
- Call `window.sporing?.track(EVENT, properties)` — optional chaining, tracker may be absent (dev, ad-blockers).
- Event names are Norwegian natural language (`'accordion åpnet'`) — always use the `Events.*` constant, never hand-write the string.
- Only fill properties defined for that event (plus BaseProperties). **Never send PII** (fnr, navn, e-post, fritekst med brukerdata) — the PII filter drops the event, and sending it is a personvern violation.
- Prefer handler-based wiring (`onOpenChange`, `onClick`, existing callbacks) over new useEffect/ref machinery. For "vist" (shown) events on mount-only components, a small `useEffect(() => track(...), [])` is fine.
- Deduplicate: fire on state *change* (e.g. only when `open === true` → åpnet), not on every render.
- Keep properties static/low-cardinality where possible (tekst, tittel, kategori — not URLs with IDs unless needed).

Generic events (skjema startet/fullført etc.) go in the app's own handlers: form start on first field interaction, fullført on successful submit, validering feilet on failed submit.

## Step 4 — Verify

1. `pnpm build` / app tests pass.
2. Runtime check: `window.sporing` must be `{ track, identify }` — if it's an `HTMLScriptElement`, the id-shadowing gotcha (prereq 2) is present.
3. DevTools Network: events POST to the ingest endpoint on interaction.
4. Events land in Innblikk: point user to Grafbygger (`/grafbygger`) filtered by event name. Allow a few minutes pipeline lag (Kafka → BigQuery).

## Report back

Summarize: components instrumented (file:line), events wired, events deliberately skipped + why, and anything the user must do (install script, register website, bump @navikt/analytics-types).

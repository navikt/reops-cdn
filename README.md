Sporingsskript
==============

Umami tracking-skript (sporingsskript) for ResearchOps-teamet. Bygges (minifiseres) og lastes opp til CDN ved push til `main`.

Skilt ut fra det (arkiverte) [umami](https://github.com/navikt/umami)-repoet.

## Struktur

```
src/                        # Kildefiler (rediger disse)
  ├── sporing.js           # Base tracker
  ├── sporing-dev.js       # Dev tracker med hardkodet endpoint
  └── sporing-reops.js     # ResearchOps-variant

plain/                      # Kopieres verbatim til CDN (ingen minifisering)
  └── skills/              # F.eks. skills/reops-add-tracking/SKILL.md
                           # -> cdn.nav.no/team-researchops/skills/reops-add-tracking/SKILL.md

build/build.js              # Bygger og minifiserer src/ -> dist/sporing/, kopierer plain/ -> dist/
dist/                       # Build output (git-ignored)
```

Alt under `plain/` lastes opp uendret ved push til `main`. Bruk det for statiske filer som skal lenkes til offentlig (skills, JSON, docs).

## Komme i gang

```bash
# Installer avhengigheter
pnpm install

# Bygg minifiserte skript til dist/
pnpm run build:tracking-scripts
```

## Eksterne avhengigheter

- [terser](https://github.com/terser/terser) - minifisering
- Nav CDN (`nais/deploy/actions/cdn-upload`) - hosting av ferdigbygde skript
- Umami - mottar sporingsdata fra skriptene

Dette repoet kjører ikke som egen Nais-app (ingen `nais.yaml`) - det bygger kun statiske filer og laster dem opp til CDN.

## Deploy & rollback

`.github/workflows/push-to-cdn.yaml` bygger og laster opp `dist/` til CDN ved push til `main` (kun ved endringer i `src/**` eller `build/build.js`), eller manuelt via `workflow_dispatch`.

Rollback: revert commiten på `main` og push (eller kjør `workflow_dispatch` mot en tidligere commit) - dette bygger og laster opp forrige versjon på nytt.

## CDN

Skriptene er tilgjengelig på:

```
https://cdn.nav.no/team-researchops/sporing/sporing.js
https://cdn.nav.no/team-researchops/sporing/sporing-dev.js
https://cdn.nav.no/team-researchops/sporing/sporing-reops.js
```

Filer fra `plain/` havner på team-roten, f.eks.:

```
https://cdn.nav.no/team-researchops/skills/reops-add-tracking/SKILL.md
```

For å se filene direkte i bucketen (f.eks. for å verifisere en opplasting eller slette en feilopplastet fil), se [Nais Console](https://console.ci-nais.cloud.nais.io) -> team-researchops -> `Settings` -> `Managed resources` -> `Team CDN bucket`-lenken, som tar deg til bucketen i Google Cloud Console.

For å sammenligne lokalt bygde filer i `dist/` mot det som faktisk ligger på CDN:

```bash
pnpm run build:tracking-scripts
pnpm run diff:cdn
```

## Andre ressurser

Se [reops-meta](https://github.com/navikt/reops-meta) for mer om ResearchOps sine repoer og systemer.

## Lisens

MIT

## Henvendelser

Spørsmål på e-post til [researchops@nav.no](mailto:researchops@nav.no), eller i Slack-kanalen [#researchops](https://nav-it.slack.com/archives/C02UGFS2J4B).

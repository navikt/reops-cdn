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

build/build.js              # Bygger og minifiserer src/ -> dist/
dist/                       # Build output (git-ignored)
```

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

## Andre ressurser

Se [reops-meta](https://github.com/navikt/reops-meta) for mer om ResearchOps sine repoer og systemer.

## Lisens

MIT

## Henvendelser

Spørsmål på e-post til [researchops@nav.no](mailto:researchops@nav.no), eller i Slack-kanalen [#researchops](https://nav-it.slack.com/archives/C02UGFS2J4B).

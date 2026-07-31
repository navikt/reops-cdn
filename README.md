Sporingsskript
==============

Umami tracking-skript (sporingsskript) for ResearchOps-teamet. Bygges og lastes opp til CDN.

Skilt ut fra det (arkiverte) [umami](https://github.com/navikt/umami)-repoet.

## Struktur

```
src/tracker/               # Kildefiler (rediger disse)
  ├── sporing.js           # Base tracker
  ├── sporing-dev.js       # Dev tracker med hardkodet endpoint
  └── sporing-reops.js     # ResearchOps-variant

public/sporing/            # Build output (git-ignored)
```

## Utvikling

```bash
# Installer avhengigheter
pnpm install

# Bygg minifiserte skript
pnpm run build:tracking-scripts
```

## CDN-opplasting

`.github/workflows/push-to-cdn.yaml` bygger og laster opp `public/sporing/` til CDN ved push til `main` (kun ved endringer i `src/tracker/**` eller build-scriptet), eller manuelt via `workflow_dispatch`.

## Henvendelser

Spørsmål på e-post til [researchops@nav.no](mailto:researchops@nav.no), eller i Slack-kanalen [#researchops](https://nav-it.slack.com/archives/C02UGFS2J4B).

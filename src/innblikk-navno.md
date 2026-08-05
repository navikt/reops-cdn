---
name: innblikk-navno-skill
description: >
  Generer BigQuery SQL mot Innblikk-datasettet (team-researchops-prod-01d6) basert på
  analytiske spørsmål på norsk. Håndterer sidevisninger, sesjoner, hendelser, UTM-parametere
  og trafikkkilder. Oppgi alltid domenet i spørsmålet, f.eks. "hvilke sider er mest besøkt på
  aksel.nav.no", "hvor mange personer var innom aktivitetsplan.nav.no sist uke" eller
  "vis hendelser over tid for arbeidsgiver.nav.no".
license: MIT
metadata:
  domain: analytics
  tags: bigquery sql analytics Nav Innblikk
---

# Innblikk SQL Skill

Turn a natural-language analytics question into BigQuery SQL for the Innblikk
tracking dataset at Nav.

---

## Step 1 – Understand the question

Identify:
- **What to count**: persons / sessions / events (see counting rules below)
- **Which dimension to group by** (page, event name, referrer, UTM, device, …)
- **Time window**: default to last 30 days if not stated
- **Which website**: **required** — `website_id` must always be present in every query. If the user does not specify a website, ask before generating SQL. Look up the correct `website_id` in the table below.

> **Ambiguous domain rule**: Some domains map to multiple websites (e.g. `arbeidsgiver.nav.no` → fritak-agp, inntektsmelding-sykepenger, min-ia, min-side-arbeidsgiver; `www.nav.no` → barnebidragskalkulator, dp-rapportering-prod, sosialhjelp-prod; `nav.no` → dp-rapportering-prod, Nav.no-minside; `felgen.ansatt.nav.no` → Felgen, kafka-test; `finnhjelpemiddel.nav.no` → finnhjelpemiddel-adminregister-prod, Finnhjelpemiddel-prod). Before generating SQL, scan the website table for any duplicate domains and apply the disambiguation rule to all of them, not only the examples listed. If the user specifies a domain that matches more than one `website_id`, list all matching websites and ask the user to confirm which one before generating SQL.

---

## Available websites

| website_id | name | domain |
|------------|------|--------|
| `d4ae85db-d511-44ed-94bf-60e424bf67e3` | a11y rapportering | a11y-statement-ny.ansatt.nav.no |
| `b2b87dc6-5a1c-4212-ac64-818f80fd12f2` | aap-saksbehandling | kelvin.intern.nav.no |
| `fb69e1e9-1bd3-4fd9-b700-9d035cbf44e1` | Aksel | aksel.nav.no |
| `d0a61c11-70da-4631-be66-6bc1316234d3` | aktivitetsplan - prod | aktivitetsplan.nav.no |
| `2523b8cc-01ba-4d8b-9b86-b9deeb56062b` | Arbeid og velferd | arbeidogvelferd.nav.no |
| `c2f0a46d-a5b4-4370-8b80-b9b9fcd39f96` | Arbeidsplassen | arbeidsplassen.nav.no |
| `e0e5e641-6d90-46ef-823c-e11ef40472cc` | ba-sak-frontend - prod | barnetrygd.intern.nav.no |
| `55af67ac-c5df-440e-80d6-518577e6de70` | barnebidragskalkulator - prod | www.nav.no |
| `ba7a8e6f-ba89-497c-997b-085fd1628326` | bidrag-ui - prod | bidrag-ui.nais.adeo.no |
| `0f5ab812-053c-4776-8ef1-0ea3778b8936` | Datamarkedsplassen | data.ansatt.nav.no |
| `efe951d8-ebbb-4fad-938e-91eee190f6aa` | Delta | delta.nav.no |
| `93a6bd08-bd82-438d-bca5-cea0832e6778` | detsombetyrnoe.no | detsombetyrnoe.no |
| `24bd3b5d-f1e6-446c-a551-0bf556592157` | dp-rapportering - demo | meldekort.ekstern.dev.nav.no |
| `feb08edd-87bf-4617-a22f-363ce00d48f6` | dp-rapportering - prod | nav.no |
| `111dd281-f3a1-4646-9554-400ac338e412` | dp-saksbehandling - prod | saksbehandling-dagpenger.ansatt.nav.no |
| `fbf07ede-921f-4553-8c13-2570df1b8957` | eessi-pensjon - prod | pensjon-utland.intern.nav.no |
| `d04ea2ae-529f-441b-8930-a0b7a7d1d137` | ef-sak | ensligmorellerfar.intern.nav.no |
| `98e556e1-0606-4f3d-a7bd-0c72e8476bb3` | etterlatte-saksbehandling - prod | etterlatte-saksbehandling.intern.nav.no |
| `09111080-9d36-4d4a-baa9-3c8f69e31970` | etterlevelse - prod | etterlevelse.ansatt.nav.no |
| `392f916d-9610-4018-822b-7f94328c1283` | fagarkiv-administrasjon | fagarkiv-administrasjon.intern.nav.no |
| `3241a68a-b0c9-4a48-ab15-152b87cfb2f7` | Fagtorsdag | fagtorsdag.ansatt.nav.no |
| `226376e1-7fdd-47df-bb34-31d7ba1c5c9f` | familie-tilbake-frontend | tilbakekreving.ansatt.dev.nav.no |
| `cc98e91e-23c4-4a06-b9f2-87bb225132b9` | fastlege - prod | finnfastlege.intern.nav.no |
| `64d56a03-c3fd-4521-9696-87d5e0511caa` | Felgen | felgen.ansatt.nav.no |
| `4f5c1a9c-d06e-40d0-abb0-b375ce339f0e` | fia - prod | fia.nav.no |
| `90c61615-5d2a-4195-a9ab-694b0aae94de` | Finnhjelpemiddel - prod | finnhjelpemiddel.nav.no |
| `a3d9368d-1e78-4002-88f2-ec66909a4d5b` | finnhjelpemiddel-adminregister - prod | finnhjelpemiddel.nav.no |
| `a201252d-99a0-4497-a7d0-44e677f7dac1` | fritak-agp - prod | arbeidsgiver.nav.no |
| `9e6f2090-3172-4114-baac-28205c4c1778` | Githubsider | navikt.github.io |
| `633be30a-1835-4b7b-900c-d6927b435ee8` | gosys-oppgavebehandling - prod | gosys.intern.nav.no |
| `c7946220-c111-4711-83bc-f773694f0a1e` | helse-speil - prod | speil.intern.nav.no |
| `97bc2b63-e714-42e8-b364-39d59e022039` | hotsak - prod | hotsak.intern.nav.no |
| `28f7fa0e-20b0-4d8e-b401-9d732ac14b4b` | Idebanken | www.idebanken.org |
| `f882b9de-b91a-4940-8e3f-e076101eaf61` | Idebanken - prod | idebanken.no |
| `0b8f9b86-ad39-48c3-9083-86ed6a399217` | Innblikk | innblikk.ansatt.nav.no |
| `c95a40cb-8c0f-43a5-9768-dfff0c21c037` | inngar - prod | start-arbeidsoppfolging.intern.nav.no |
| `3c28efee-60ed-44f7-94fb-b8a5e82f0216` | inngar-ekstern | start-arbeidsoppfolging.nav.no |
| `4c9f8264-9a4d-465d-9023-77646166f083` | inntektsmelding-sykepenger - prod | arbeidsgiver.nav.no |
| `342d6f37-955e-4db3-a9de-f3e3a4df508d` | kafka-test | felgen.ansatt.nav.no |
| `53e7f8ec-26e3-4e42-a41a-cddde0d58709` | Klarspråkshjelpen | spraksjekk.navikt.github.io |
| `8d67a685-6464-4206-8b0c-3627f07368c4` | ks-sak-frontend - prod | kontantstotte.intern.nav.no |
| `4e3f6f63-e4ae-44b8-9e15-2a887f9356d2` | Kunnskapsbanken | www.kunnskapsbanken.net |
| `97ae1e1a-cb15-4611-9a76-787c989f83d6` | Mangfoldimai | www.mangfoldimai.no |
| `842ab9d6-3c26-4f3f-a5da-d2177bc4f473` | MEMU | memu.no |
| `881d4cb8-e2a3-42da-9da6-83b6220c7f7e` | min-ia - prod | arbeidsgiver.nav.no |
| `3ab987de-cf5c-47a9-a04d-bcf6316f2204` | min-side-arbeidsgiver - prod | arbeidsgiver.nav.no |
| `ec13193d-a5b2-4ec1-a0e5-1bd4c798a9b3` | modia-arbeidssokerregisteret - prod | arbeidssokerregistrering-for-veileder.intern.nav.no |
| `2fc75a89-48ec-4580-91ee-21aab6798ace` | modia-sosial - prod | sosialhjelp-modia.intern.nav.no |
| `a8c2ec9c-2846-4154-8841-5db26494171a` | modiapersonoversikt - prod | modiapersonoversikt.intern.nav.no |
| `182ed73a-eaa9-4ea0-9e30-7a0a74c5c396` | mr-admin-flate - prod | tiltaksadministrasjon.intern.nav.no |
| `ec0f68ed-c81e-40d7-9b6b-9ab653eb30e1` | Nais | nais.io |
| `28461d11-25ed-4e27-bfc6-6994e6dffb63` | Nav.no - minside | nav.no |
| `35abb2b7-3f97-42ce-931b-cf547d40d967` | Nav.no - prod | www.nav.no |
| `83b80c84-b551-4dff-a679-f21be5fa0453` | Navet | navno.sharepoint.com |
| `7d7d1d3b-45ce-4e1f-a23a-aabc7c2db1f5` | nks-bob - prod | bob.ansatt.nav.no |
| `6dd2ad0d-28d2-4934-93dc-b95448b37915` | oppslag-bruker-frontend - prod | oppslag-bruker.intern.nav.no |
| `00396ce6-d27e-4271-85d2-65c0d4de3b8d` | pdl-web - prod | pdl-web.intern.nav.no |
| `cb9cf075-6a8d-427f-b42a-7b1e2e0f6568` | psak - prod | pensjon-psak.intern.nav.no |
| `0c1fddf8-44fc-4e29-8c69-8e0875ffbb4a` | rekrutteringsbistand-frontend - prod | rekrutteringsbistand-frontend.intern.nav.no |
| `8f25f313-f86f-44fa-aef3-0b0dc1fc480a` | reops-health-probe | reops-health-probe.ansatt.nav.no |
| `9d7fee10-f315-4e79-a54b-7440596de606` | skribenten-web | pensjon-skribenten.intern.nav.no |
| `aca7085d-8968-415b-bc32-20e4a03abf8d` | sosialhjelp - prodtest | www.ekstern.dev.nav.no |
| `82a0745a-b0b1-419a-82cb-cd4b0849b6bf` | sosialhjelp-prod | www.nav.no |
| `8c9ebc0a-63d8-46b2-a34c-9378f809e595` | sporingsskript-testsider | sporingsskript-test.ansatt.nav.no |
| `8e935f84-fb1e-4d07-be28-410eb2ab8cb9` | Start Umami | startumami.ansatt.nav.no |
| `15137b6d-7eed-44f5-aad3-f5f6ed3efa3c` | su-se-framover - prod | supstonad.intern.nav.no |
| `d9c74695-30bc-47e9-b751-bebd1c7472a0` | syfomodiaperson - prod | syfomodiaperson.intern.nav.no |
| `19fa498f-4d3e-4ad5-b484-e16469cb569b` | syfomoteoversikt - prod | syfomoteoversikt.intern.nav.no |
| `ef4034fe-08a4-42a6-8f3c-e24751455026` | syfooversikt - prod | syfooversikt.intern.nav.no |
| `f8157d1d-b9ff-4208-9281-882e4594c126` | Teknologiradar | teknologiradar.ansatt.nav.no |
| `74faef03-4e3b-4783-b1de-1df31f8695a1` | tilleggsstonader - prod | tilleggsstonader.intern.nav.no |
| `8ab9035b-69e3-4145-8c44-19d1bd3d7bd9` | ungdomsytelse-veileder - prod | ungdomsytelse-veileder.intern.nav.no |
| `e1b661e6-a812-4433-a1e7-4648212fddfe` | utbetalingsportalen - prod | utbetalingsportalen.intern.nav.no |
| `79ba245d-fd50-44e5-87e5-24bf26c8e7af` | veilarbdetaljerfs - prod | veilarbdetaljer.intern.nav.no |
| `4d815e07-ee57-47ca-bc1f-bc1c89fe5c60` | veilarbpersonflate - prod | veilarbpersonflate.intern.nav.no |
| `e76b7abe-f2c7-4399-a09f-31d99b82f872` | veilarbportefoljeflatefs - prod | veilarbportefoljeflate.intern.nav.no |
| `aa87c5d4-8afe-4ea8-bc92-884bd127b1e7` | veilarbvisitkortfs - prod | veilarbvisittkortfs.ansatt.dev.nav.no |

---

## Step 2 – Apply counting rules

| User says | SQL expression | Notes |
|-----------|----------------|-------|
| person / bruker (default) | `COUNT(DISTINCT e.session_id)` | `session_id` identifies a browser/device across visits within a rolling window — used as a person-level proxy for most sites |
| person / bruker (Nav.no - prod `35abb2b7-3f97-42ce-931b-cf547d40d967` only) | `COUNT(DISTINCT s.distinct_id)` | Requires `JOIN … session s ON s.session_id = e.session_id`; uses cookie-based cross-session identity |
| økt / session | `COUNT(DISTINCT e.visit_id)` | `visit_id` identifies a single browsing session |
| hendelse / event | `COUNT(DISTINCT e.event_id)` | |
| sidevisning | `COUNT(DISTINCT e.event_id)` + filter `event_type = 1` | |

---

## Step 3 – Pick the right table and dimensions

Primary table for almost every query:
```
`team-researchops-prod-01d6.umami_views.event`
```

Available dimensions on `event`:
- `url_path`, `page_title`
- `event_name`, `event_type`
- `referrer_domain`
- `utm_source`, `utm_campaign`, `utm_medium`, `utm_term`
- `created_at`

Available dimensions on `session` (requires JOIN):
- `browser`, `device`, `os`, `country`, `language`

Join to session when you need session-level attributes not in the event view:
```
`team-researchops-prod-01d6.umami_views.session`
```

Join to websites when you need the website name/domain:
```
`team-researchops-prod-01d6.umami.public_website`
```

Join to event_data for custom event properties:
```
`team-researchops-prod-01d6.umami_views.event_data`
```

Custom event properties are stored as nested rows in `event_parameters`. Each row has `data_key`, `string_value`, `number_value`, `date_value`, and `data_type`. Example join:
```sql
JOIN `team-researchops-prod-01d6.umami_views.event_data` ed
  ON ed.website_event_id = e.event_id
JOIN UNNEST(ed.event_parameters) AS ep
  ON ep.data_key = @param_key
```

---

## Step 4 – Build the query from the skeleton

> **Nav.no - prod exception**: When `website_id = '35abb2b7-3f97-42ce-931b-cf547d40d967'` (Nav.no - prod) and counting persons/brukere, use `COUNT(DISTINCT s.distinct_id)` with `JOIN … session s ON s.session_id = e.session_id` instead of `COUNT(DISTINCT e.session_id)`.

```sql
SELECT
  <grouping_column>          AS <label>,
  <COUNT(DISTINCT ...)>      AS verdi
FROM `team-researchops-prod-01d6.umami_views.event` e
WHERE e.website_id  = @website_id
  AND e.created_at >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 30 DAY)
  AND e.created_at <  CURRENT_TIMESTAMP()
  -- add extra filters here (event_type, event_name, url_path, …)
GROUP BY 1
ORDER BY verdi DESC
LIMIT 20;
```

BigQuery-specific rules:
- `DATE_TRUNC(col, DAY|WEEK|MONTH)` — column comes first
- Use `@param` syntax for parameterized queries
- Never use `::` casting — use `CAST(x AS TYPE)` or `SAFE_CAST`
- String literals use single quotes
- **`TIMESTAMP_SUB` only accepts `MICROSECOND`, `MILLISECOND`, `SECOND`, `MINUTE`, `HOUR`, and `DAY`** — for `WEEK`, `MONTH`, `QUARTER`, or `YEAR` offsets, convert via `DATE`: `TIMESTAMP(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH))`

---

## Step 5 – Output format

Return:
1. **One-sentence interpretation** of what the query measures
2. **The SQL** in a fenced code block (` ```sql `)
3. **Parameters** — list any `@params` the user must fill in
4. **Optional follow-up** — one suggestion for a useful next query

Keep the SQL clean and runnable. No placeholder comments inside the SQL itself.

If the user's question requires data not available in the schema (columns or tables not listed above), explain which information is missing and ask the user to clarify rather than inventing column names.

---

## Common query patterns

### Mest besøkte sider (last 30 days)
```sql
SELECT
  e.url_path,
  COUNT(DISTINCT e.session_id) AS personer
FROM `team-researchops-prod-01d6.umami_views.event` e
WHERE e.website_id  = @website_id
  AND e.created_at >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 30 DAY)
  AND e.created_at <  CURRENT_TIMESTAMP()
GROUP BY 1
ORDER BY personer DESC
LIMIT 20;
```

### Hendelser over tid (daily)
```sql
SELECT
  DATE_TRUNC(e.created_at, DAY) AS dag,
  COUNT(DISTINCT e.event_id)    AS hendelser
FROM `team-researchops-prod-01d6.umami_views.event` e
WHERE e.website_id  = @website_id
  AND e.created_at >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 30 DAY)
  AND e.created_at <  CURRENT_TIMESTAMP()
GROUP BY 1
ORDER BY dag;
```

### Trafikkkilder
```sql
SELECT
  e.referrer_domain,
  COUNT(DISTINCT e.session_id) AS personer
FROM `team-researchops-prod-01d6.umami_views.event` e
WHERE e.website_id  = @website_id
  AND e.created_at >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 30 DAY)
  AND e.created_at <  CURRENT_TIMESTAMP()
  AND e.referrer_domain IS NOT NULL
GROUP BY 1
ORDER BY personer DESC
LIMIT 20;
```

### Andel personer som utfører hendelse X
```sql
WITH alle AS (
  SELECT COUNT(DISTINCT session_id) AS total
  FROM `team-researchops-prod-01d6.umami_views.event`
  WHERE website_id  = @website_id
    AND created_at >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 30 DAY)
    AND created_at <  CURRENT_TIMESTAMP()
),
med_hendelse AS (
  SELECT COUNT(DISTINCT session_id) AS antall
  FROM `team-researchops-prod-01d6.umami_views.event`
  WHERE website_id  = @website_id
    AND event_name  = @event_name
    AND created_at >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 30 DAY)
    AND created_at <  CURRENT_TIMESTAMP()
)
SELECT
  med_hendelse.antall                                   AS med_hendelse,
  alle.total                                            AS totalt,
  ROUND(med_hendelse.antall / alle.total * 100, 1)      AS prosent
FROM alle, med_hendelse;
```

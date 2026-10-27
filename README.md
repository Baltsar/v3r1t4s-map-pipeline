# v3r1t4s-map-pipeline

Overnight research-pipeline: DeepSeek Flash + Pliny's V3R1T4S tailored for OpenSverige AI-kartan (find missing orgs, generate content).

Nattlig research för [OpenSverige AI-kartan](https://karta.opensverige.se) och
[infra.opensverige.se](https://infra.opensverige.se). Pipeline letar efter
svenska och nordiska AI-infrastrukturaktörer som **inte** redan finns i de två
baslinjerna, och skriver dem som korta Fact-poster med källa och datum.

Repot rör aldrig `opensverige-ai-infra` eller `opensverige/ai-kartan`. Det
producerar kandidater. En människa avgör vad som tas in.

## Varför

Databaserna är vallgraven, inte katalogen. En kandidat som hittas i natt men
aldrig skrivs ner är borta i morgon. Varje post bär därför sin egen provenance
(`värde + status + källa + datum`) redan när den hittas, i samma form som
`opensverige-ai-infra` använder. Då går den att granska, avvisa eller flytta in
utan att någon behöver göra om arbetet.

## Statusdisciplin (icke förhandlingsbart)

Samma regler som infra och karta. De är inte riktlinjer.

| Status | Kräver |
|---|---|
| `confirmed` | `source_url` + `verified_at`, och källan får inte vara organisationens egen sida |
| `claimed` | Organisationens egen sida, egna dokument eller press |
| `planned` | Uttalat mål som inte är uppnått |
| `unknown` | Inte undersökt. `value: null` |

- **Egen webbplats ger högst `claimed`.** `confirmed` kräver
  `company_register`, `regulator`, `third_party`, `academic` eller
  `infra_dataset`.
- **Suveränitet, zero-retention och no-training är `claimed`** tills påståendet
  är verifierat mot DPA, villkor eller certifikat. Marknadscopy räcker aldrig.
- **Certifieringar: uppnådd skiljs från planerad.** "Vi siktar på ISO 27001" är
  `planned`, inte `confirmed`.
- **Hellre ärligt `unknown` än felaktigt `confirmed`.**
- **Inga påhittade siffror.** Pris, kapacitet och modellantal kräver en URL som
  visar talet, annars `unknown`.

## Datakontrakt

`schema/candidate.schema.json` är kanoniskt. En kandidat är en platt post där
varje jämförelsefält är en Fact:

```json
{
  "id": "slug",
  "name": { "value": "…", "status": "claimed", "source_url": "…",
            "source_type": "own_site", "verified_at": "YYYY-MM-DD" },
  "layer": { "value": "inference_api", "status": "confirmed", "source_url": "…",
             "source_type": "provider_docs", "verified_at": "YYYY-MM-DD" },
  "layer_proposal": false,
  "sovereignty": {
    "country_hq": { "…": "Fact" },
    "ownership_jurisdiction": { "…": "Fact" },
    "foreign_parent": { "…": "Fact" },
    "zero_retention": { "…": "Fact" },
    "no_training": { "…": "Fact" }
  },
  "sources": [
    { "url": "…", "source_type": "own_site", "http_status": 200,
      "robots_allowed": true, "fetched_at": "YYYY-MM-DD" }
  ],
  "dedupe": { "checked_against": ["ai-infra", "ai-kartan"],
              "matches": [], "verdict": "new" },
  "qc": { "reviewer": "deterministic", "passed": true, "issues": [] },
  "discovered_at": "YYYY-MM-DD",
  "batch": "runs/2026-10-26/batch-01.json"
}
```

Lager utanför `opensverige-ai-infras` enum (`mcp_server`, `hosting`,
`sovereign_cloud`) sätts med `layer_proposal: true`. De lever bara i
kandidatfilen. `schema.json` i infra ändras inte av den här pipelinen.

## Baslinje

`node scripts/index-baseline.mjs` hämtar tre källor och skriver
`state/baseline.json`:

| Källa | Vad den ger |
|---|---|
| `https://infra.opensverige.se/api/data` | 28 leverantörer med id, namn, webbplats, org.nr |
| `data/kandidater.json` i ai-infra | Parkerade kandidater som inte ska hittas igen |
| `../v1/data/organisationer/*.yaml` | 340 organisationer på kartan |

Dubblettkontroll sker på id, domän, organisationsnummer och namn-trigram. Ett
domänmatch är starkare än ett namnmatch.

## Körning

```bash
node scripts/index-baseline.mjs     # bygg om baslinjen
node scripts/start-batch.mjs        # skapa runs/<datum>/batch-NN.json
#   … research: fyll i kandidater i batchen …
node scripts/close-batch.mjs        # validera, dedupa, merga, logga
node scripts/status.mjs             # progress + om stoppvillkoret är nått
node scripts/qc.mjs                 # kontrollera källorna mot nätverket
node scripts/report.mjs             # data/candidates-YYYY-MM-DD.md
node scripts/stop.mjs "orsak"       # registrera varför körningen stannade
npm test                            # validatorn och dubblettreglerna
```

`start-batch` väljer nästa frågefamilj som inte är uttömd, skriver frågorna och
öppnar batchen. `close-batch` vägrar stänga en batch som inte validerar.

### Frågefamiljer

`config/scope.json` äger listan. En familj är uttömd när den kört utan nya
verifierbara organisationer två gånger i rad.

1. Svensk inferens och GPU — komplettera mot kartans befintliga poster.
2. Nordisk sovereign cloud och hosting — NO, DK, FI, IS.
3. Nationell HPC, beräkningsresurser och AI-fabriker i Norden.
4. Suveränitet och compliance — de som säljer på Cloud Act-frihet.
5. MCP-servrar med nordisk avsändare — officiella registret + GitHub.
6. Registerverifiering — allabolag, Brønnøysund, CVR, PRH, Skatturinn.

Familj 6 har `discovery: false`. Den letar inte nya organisationer, den stänger
`claimed`-fält på redan funna, och räknas därför aldrig som uttömd. Annars skulle
stoppvillkoret slå till just för att verifieringen fungerade.

## Stoppvillkor

`close-batch` räknar och `status.mjs` avgör. Körningen stoppar när något av
följande inträffar:

- **Två batchar i rad med noll nya verifierbara organisationer.** Det är
  huvilken: fler sökningar ger inte mer.
- **Sex timmar wall clock** sedan första batchen.
- **Hundra kandidater** i kandidatfilen.

Stopporsaken skrivs i `runs/<datum>/kornlogg.md` och i sammanfattningen. Att
stoppa tidigt är ett resultat, inte ett misslyckande.

## Återupptagning

All state ligger på disk. `runs/<datum>/seen.json` håller varje sedd domän och
varje avvisad kandidat med orsak, så en avbruten natt fortsätter där den
slutade:

```bash
node scripts/status.mjs        # säger exakt nästa steg
```

## Dubblettkontroll

Ordningen är stark till svag, och en av dem är medvetet mjuk:

| Bevis | Utfall |
|---|---|
| Samma id | dubblett |
| Samma domän | dubblett |
| Samma org.nr **och** liknande namn | dubblett |
| Samma org.nr, olika namn | osäker — människa avgör |
| Liknande namn | osäker — människa avgör |

Ett delat organisationsnummer bevisar samma juridiska person, inte samma
organisatoriska enhet. Uppsala universitet har ett nummer och många enheter.
Därför ger org.nr ensamt aldrig ett dubblettbesked.

## Källor som inte går att läsa

En källa som svarar 403 eller som robots.txt förbjuder får inte bära en post,
även om uppgiften är riktig — posten ska gå att kontrollera maskinellt.
`allabolag.se` nekar research-User-Agents (verifierat 2026-10-26). Använd en
spegel som svarar, till exempel `letabolag.se`, och nämn allabolag bara i en note.

## Stoppa

Automatiska stoppvillkor finns i `config/scope.json` och räknas av `status.mjs`.
Ett manuellt stopp registreras med orsak:

```bash
node scripts/stop.mjs "sessionen tog slut"
```

Orsaken skrivs till `runs/<datum>/stopp.json` och till körloggen, och hamnar i
sammanfattningen. Ett stopp utanför villkoren betyder att körningen tog slut,
inte att sökandet är uttömt. Skillnaden står i filen.

## Kvalitetskontroll

Två lager, i den ordningen:

1. **Deterministisk** (`scripts/lib/validate.mjs`): schema, statusregler,
   källtyp mot status, HTTP-svar, robots.txt, dubblett mot baslinjen.
2. **Adversariell**: en fristående granskare som bara ser posten och källan och
   ska motbevisa varje `confirmed`. Underkända poster flyttas till
   `runs/<datum>/rejected.json` med orsak, aldrig tyst bort.

`scripts/qc.mjs` kör lager 1. Lager 2 körs av agenten per batch och bokförs i
`qc.reviewer: "agent"`.

`QC_MODEL=anthropic` är en förberedd krok för att flytta lager 2 till en extern
modell. Den kräver `ANTHROPIC_API_KEY` och är avstängd som standard.

## Output

```
data/candidates-YYYY-MM-DD.json    kanonisk kandidatfil för dagen
data/candidates-YYYY-MM-DD.md      sammanfattning för läsning
state/baseline.json                baslinjen (genererad)
runs/YYYY-MM-DD/batch-NN.json      en batch, öppen eller stängd
runs/YYYY-MM-DD/kornlogg.md        körlogg: frågor, URL:er, utfall, stopporsak
runs/YYYY-MM-DD/seen.json          sedda domäner och avvisade kandidater
```

## Vad pipelinen inte gör

- Skriver inte till `opensverige-ai-infra` eller `opensverige/ai-kartan`.
- Ändrar inte `schema.json` i infra. Nya lager flaggas som förslag.
- Lägger inte till enskilda firmor. Posten är en personuppgift.
- Sparar inte personuppgifter: inga namn, e-postadresser eller telefonnummer.
- Kopierar inte beskrivningar från andra kartor. Andra listor ger bara namn.
- Rankar inte. Ingen post är "bäst".

## Licens

Kod MIT. Data CC-BY-4.0 med attribution till OpenSverige och verifieringsdatum.

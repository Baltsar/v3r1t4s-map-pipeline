# Granskningsunderlag — nattkörning 2026-10-26

Skrivet för en fristående granskare. Läs det som en påståendelista, inte som en
sammanfattning: varje rad går att motbevisa mot en URL.

- **Körning:** 6 batchar, 2026-10-26 kl 21:50–22:07 UTC
- **Resultat:** 17 kandidater i `data/candidates-2026-10-26.json`
- **Branch:** `overnight/2026-10-26`, PR #1 mot `main`
- **Kod:** `scripts/`, tester i `scripts/lib/validate.test.mjs` (22/22)
- **Ingen skrivning** till `opensverige-ai-infra` eller `opensverige/ai-kartan`

## Vad granskaren ska avgöra

Fyra frågor, i den ordningen:

1. **Håller varje `confirmed`?** 46 fält. Källan ska visa värdet, och källan får
   inte vara organisationen själv. Det är hela regeln.
2. **Är något `claimed` egentligen `planned`?** Uttalat mål som skrivits som
   befintligt är det vanligaste felet i den här sortens data.
3. **Är `unknown` rätt?** 37 fält står som okända. Ett `unknown` där källan finns
   är slöseri; ett `claimed` där den inte finns är värre.
4. **Är lagerindelningen försvarbar?** Sju poster ligger utanför infra-enumet.

## 1. Alla 46 confirmed, i klartext

Samtliga avser **juridisk identitet eller hemvist**. Inget avser suveränitet,
retention eller certifiering.

| Post | Fält | Värde | Källa | Källtyp |
|---|---|---|---|---|
| kepler-cloud | legal_name | Kepler Technologies AB | letabolag.se | third_party |
| kepler-cloud | org_number | 556858-3131 | letabolag.se | third_party |
| kepler-cloud | country_hq | Sverige | letabolag.se | third_party |
| binero | legal_name | Binero Group AB (publ) | letabolag.se | third_party |
| binero | org_number | 556264-3022 | letabolag.se | third_party |
| binero | country_hq | Sverige | letabolag.se | third_party |
| cerebro-cloud | org_number | 559231-7191 | letabolag.se | third_party |
| cerebro-cloud | country_hq | Sverige | letabolag.se | third_party |
| upcloud | legal_name | UpCloud Oy | PRH | company_register |
| upcloud | org_number | 2431560-5 | PRH | company_register |
| upcloud | country_hq | Finland | PRH | company_register |
| telenor-ai-factory | legal_name | Telenor AI Factory Norway AS | Brønnøysund | company_register |
| telenor-ai-factory | org_number | 932968312 | Brønnøysund | company_register |
| telenor-ai-factory | country_hq | Norge | Brønnøysund | company_register |
| polartix | legal_name | Polartix AS | Brønnøysund | company_register |
| polartix | org_number | 934631080 | Brønnøysund | company_register |
| polartix | country_hq | Norge | Brønnøysund | company_register |
| net-zero-compute | legal_name | Net Zero Compute AS | Brønnøysund | company_register |
| net-zero-compute | org_number | 920254977 | Brønnøysund | company_register |
| net-zero-compute | country_hq | Norge | Brønnøysund | company_register |
| hunex | legal_name | Hunex ApS | virkly.io | third_party |
| hunex | org_number | 46602463 | virkly.io | third_party |
| hunex | country_hq | Danmark | virkly.io | third_party |
| scan-net | legal_name | team.blue Denmark A/S | virkly.io | third_party |
| scan-net | org_number | 29412006 | virkly.io | third_party |
| scan-net | country_hq | Danmark | virkly.io | third_party |
| sigma2 | legal_name | Sigma2 AS | Brønnøysund | company_register |
| sigma2 | org_number | 814864332 | Brønnøysund | company_register |
| sigma2 | country_hq | Norge | Brønnøysund | company_register |
| csc | legal_name | CSC – Tieteen tietotekniikan keskus Oy | PRH | company_register |
| csc | org_number | 0920632-0 | PRH | company_register |
| csc | country_hq | Finland | PRH | company_register |
| ucloud-ai | legal_name | Syddansk Universitet | sdunet.dk | third_party |
| ucloud-ai | org_number | 29283958 | sdunet.dk | third_party |
| ucloud-ai | country_hq | Danmark | sdunet.dk | third_party |
| ucloud-ai | foreign_parent | false | sdunet.dk | third_party |
| uppmax | legal_name | Uppsala universitet | uu.se | third_party |
| uppmax | org_number | 202100-2932 | uu.se | third_party |
| uppmax | country_hq | Sverige | uu.se | third_party |
| uppmax | foreign_parent | false | uu.se | third_party |
| liminity | legal_name | Liminity AB | bolag.hk-r.se | third_party |
| liminity | org_number | 559091-7851 | bolag.hk-r.se | third_party |
| liminity | country_hq | Sverige | bolag.hk-r.se | third_party |
| obenet | legal_name | Obenet AB | firmainfo.se | third_party |
| obenet | org_number | 556898-6763 | firmainfo.se | third_party |
| obenet | country_hq | Sverige | firmainfo.se | third_party |

## 2. Två fel jag hittade och rättade själv

Båda var `confirmed` där källan inte bar värdet. De stod kvar i PR:en tills
granskningen 2026-10-27.

**binero / foreign_parent = false.** Sattes som `confirmed` med
Aktiemarknadsnämndens beslut 2025:54 som källa. Beslutet säger att
majoritetsägaren Tiliaflore AB är ett svenskt aktiebolag — det bevisar första
ledet, inte hela kedjan. Noten sa det själv ("ägarkedjan ovanför är inte prövad"),
vilket gjorde `confirmed` fel. Nu `claimed`.

**cerebro-cloud / legal_name = Barrage Nordx AB.** Källan var registret, men
registret visar bara att Barrage Nordx AB finns — inte att Cerebro Cloud drivs av
dem. Kopplingen står i ett pressmeddelande. Nu `claimed` med pressmeddelandet som
källa; `org_number` står kvar som `confirmed` eftersom numret onekligen tillhör
Barrage Nordx AB. Två säkerhetsnivåer för samma verklighet, med flit.

**Mönstret värt att leta efter:** en `confirmed` vars källa styrker ett
**delpåstående** men inte det påståendet posten gör. Det var felet i båda fallen.

## 3. Där jag är minst säker — granska dessa först

| Post | Vad som kan vara fel |
|---|---|
| **scan-net** | `legal_name = team.blue Denmark A/S` vilar på att A/S ScanNet och team.blue Denmark A/S delar CVR 29412006. Det är starkt, men innebär att posten heter ett annat namn än leverantören marknadsför. Rimligt eller förvirrande? |
| **ucloud-ai** | `legal_name = Syddansk Universitet`. Sant som juridiskt subjekt, men UCloud är en plattform, inte universitetet. Samma sak för **uppmax** (Uppsala universitet). Alternativet är att inte sätta `legal_name` alls. |
| **polartix** | Registrerad bransch är IT-konsult, inte datacenter. Sajten beskriver ett bergrum utan ort, utan org.nr, utan kundreferens. Bolaget är knappt två år. Inget är fel — men lite är bevisat. |
| **hunex** | Registrerat 2026-07-01, alltså fyra månader före körningen, med 20 000 DKK i kapital, men marknadsför H100 till B300. Kapacitetspåståendet är `claimed` och bör förbli det. |
| **cerebro-cloud** | Kapacitetssiffrorna (2/4/12 MW) är leverantörens egna. Hydrocompute 1 kan vara Hydro66:s gamla anläggning, som Northern Data köpte 2021 — släktskapet är **inte** verifierat och påstås inte. |
| **telenor-ai-factory** | `foreign_parent = false` vilar på att Telenor Group är norskt. Norska statens ägarandel är inte kontrollerad mot källa. |
| **net-zero-compute** | Fyra norska bolag heter Net Zero. Koncernkopplingen mellan Net Zero Compute AS och anläggningen i Glomfjord är inte utredd. |

## 4. Nollresultat som är ett resultat

**MCP-familjen gav noll, och det är underbyggt.** 40 sidor ur
`registry.modelcontextprotocol.io` = 4 000 poster, 1 164 unika servrar, noll med
nordiskt domänprefix (`.se/.no/.dk/.fi/.is`). Nyckelordssökning på länder och
städer gav en träff: `ai.husverket/husverket`, en kunskapsbas för attefallshus.

GitHub gav 28 träffar på `topic:mcp-server+sweden` och 9 på `mcp in:name nordic`.
Alla är dataåtkomst ovanpå öppna data — Riksdagen, SCB, Kolada, Skolverket,
Avanza, nordiska bolagsregister — byggda av enskilda utvecklare. Berget AI och
staik har noll publika MCP-repon.

**Slutsatsen som bör prövas:** MCP är ett *stöd* i en produkt, inte ett eget
organisationslager. Om den håller ska `mcp_server` strykas ur `scope.json`, inte
bli en egen kategori i infra.

## 5. Fynd som rör befintliga databaser

Fullständigt i `runs/2026-10-26/fynd.json`. De fyra som spelar roll:

**allabolag.se svarar 403** för pipelins User-Agent (verifierat, tre anrop).
Det tvingade fram en metodregel: en källa som inte går att hämta maskinellt får
inte bära en post, även om uppgiften är riktig. Registren läses nu via
`letabolag.se`, `virkly.io`, `firmainfo.se`. **Kontrollera att de speglar samma
register och inte är egna databaser.**

**Bergets DPA namnger AI Iron AB (559490-8054)** som underbiträde för GPU
bare-metal. `ai-infra` har posten `airon` **utan** org.nr. Luckan är därmed
identifierad men inte åtgärdad — pipelinen skriver inte till infra.

**Samma bolag har två id:n** i baslinjen: `mimer` / `sweden-ai-factory` (båda
`swedenaifactory.se`) och `opper` / `opper-ai` (båda `opper.ai`).

**NAISS Arrhenius saknas på kartan.** 382 GPU-noder med 4× NVIDIA GH200 var, i
produktion sedan 2026-07-01, ersätter Alvis och Mimer. Sveriges största
GPU-resurs, och den nämns inte. Källa: `supr.naiss.se/round/2026medium/`.

## 6. Vad pipelinen inte kan säga något om

- **Priser.** Bara fyra av 17 publicerar priser läsbart: Liminity (3 995 kr/mån
  för MIG, 12 995 för dedikerad GPU), Kepler Cloud (per GPU-modell och timme),
  HuneX (per GPU och timme, femårskontrakt) och UpCloud (från 1,11 €/h för
  L40S). Övriga kräver offert — Cerebros prissida svarar 404. Ingen
  prisjämförelse är gjord, och ingen bör göras ur det här materialet.
- **Verklig kapacitet.** Alla MW- och GPU-siffror är leverantörens egna. Ingen
  är kontrollerad mot tredje part.
- **Certifieringar.** Schemat har inget certifieringsfält. Obenets ISO 27001 är
  "certification in progress" enligt deras egen sida, och kan därför inte
  uttryckas alls i en post — det är en lucka i `schema/candidate.schema.json`,
  inte i posten. Ska åtgärdas innan någon post flyttas in.
- **Zero retention.** Bara fyra fält är ifyllda, alla `claimed`. Bergets DPA
  finns och är stark, men Berget är redan i infra och därför ingen kandidat.

## 7. Så återskapar du körningen

```bash
cd pipeline
node scripts/index-baseline.mjs
npm test
node scripts/qc.mjs --strict --datum 2026-10-26
node scripts/report.mjs --datum 2026-10-26
```

`--datum` behövs för att en nattkörning som passerar midnatt ska gå att granska
morgonen därpå. Flaggan dokumenteras i README.

## 8. Det jag helst vill att granskaren går i clinch med

1. **Är `foreign_parent` överhuvudtaget ett fält som går att sätta `confirmed`
   på?** Att bevisa att *ingen* utländsk ägare finns i en kedja kräver en
   fullständig ägarkarta, inte ett registerutdrag. Kanske ska fältet alltid vara
   `claimed` om det inte kommer från ett register som visar hela kedjan.
2. **Ska en post få heta ett varumärke när `legal_name` är ett annat bolag?**
   ai-infra gör det (Berget AI / Berget AI AB), men där är kopplingen självklar.
   För ScanNet och Cerebro är den inte det.
3. **Är `hosting` och `sovereign_cloud` rätt svar, eller ska Binero, UpCloud,
   Liminity och Obenet helt enkelt inte vara med?** En colocation-operatör säljer
   inte AI. Att ta in dem gör databasen bredare men jämförelsen suddigare.
4. **Håller avgränsningen "Norden"?** Norge och Island är EES, inte EU. Det
   påverkar varje jurisdiktionsfält och bör stå i metodtexten, inte bara i noter.

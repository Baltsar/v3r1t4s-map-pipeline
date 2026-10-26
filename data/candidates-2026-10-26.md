# Kandidater 2026-10-26

Genererad av v3r1t4s-map-pipeline 2026-10-26T22:08:37.209Z.

Kandidater, inte intag. En post här är verifierad mot sin källa men inte
granskad av en människa. Ingenting skrivs in i `opensverige-ai-infra` eller
`opensverige/ai-kartan` av den här pipelinen.

## Sammanfattning

- Kandidater: **17**
- Batchar: 6 stängda av 6
- Avvisade: 0 (sparade med orsak i `runs/2026-10-26/rejected.json`)
- Osäkra dubbletter, kräver människa: 1
- Poster med öppna frågor: 17 (46 frågor)
- Underkända i QC: 0
- Körtid: 0.3 h
- Stopporsak: Sessionen tog slut efter 6 batchar. Inget automatiskt stoppvillkor var uppfyllt: 17 kandidater av 100, 0,2 h av 6 h, och bara MCP-familjen har en tom körning i rad. Sökandet är inte uttömt — de fem discovery-familjerna hade mer kvar.
- Stoppet var inte ett automatiskt villkor. Sökandet är inte uttömt — se `runs/2026-10-26/stopp.json`.

## Per lager

- compute_gpu: 8
- hosting: 5 (förslag utanför infra-enumet)
- inference_api: 2
- sovereign_cloud: 2 (förslag utanför infra-enumet)

## Per hemvist

- Sverige: 7
- Norge: 4
- Danmark: 4
- Finland: 2

## Statusfördelning på fält

- confirmed: 18
- claimed: 79
- planned: 0
- unknown: 37

`confirmed` betyder att fältet står i en källa som inte är organisationen själv.
Egen webbplats ger högst `claimed`, hur säkert det än låter.

## Kandidater

| Id | Namn | Lager | Hemvist | Suveränitet | Källa | QC |
|---|---|---|---|---|---|---|
| sval-compute | Sval Compute | inference_api | Sverige | Sverige/EU | https://svalcompute.com/ | ok |
| kepler-cloud | Kepler Cloud | compute_gpu | Sverige | Sverige/EU | https://keplercloud.se/gpu/ | ok |
| binero | Binero | hosting | Sverige | Sverige/EU | https://binero.com/sv/it-tjanster/molntjanster/publik-molntjanst/ | ok |
| cerebro-cloud | Cerebro Cloud | hosting | Sverige | Sverige/EU | https://cerebro.cloud/ | ok |
| upcloud | UpCloud | compute_gpu | Finland | Finland/EU | https://upcloud.com/global/products/gpu-servers/ | ok |
| telenor-ai-factory | Telenor AI Factory | sovereign_cloud | Norge | Norge/EU | https://www.telenoraifactory.no/ | ok |
| polartix | Polartix | sovereign_cloud | Norge | Norge | https://polartix.no/ | ok |
| net-zero-compute | Net Zero Compute | hosting | Norge | Norge | https://netzerocompute.com/nb/suveren-ai-produksjon/ | ok |
| hunex | HuneX | compute_gpu | Danmark | Danmark/EU | https://hunex.com/ | ok |
| scan-net | ScanNet | compute_gpu | Danmark | Danmark/EU | https://www.scannet.dk/gpu-as-a-service/ | ok |
| unit-it | Unit IT | hosting | Danmark | Danmark/EU | https://unit-it.dk/managed-ai-cloud | ok |
| sigma2 | Sigma2 | compute_gpu | Norge | Norge/EU | https://www.sigma2.no/ | ok |
| csc | CSC | compute_gpu | Finland | Finland/EU | https://research.csc.fi/computing | ok |
| ucloud-ai | UCloud AI | compute_gpu | Danmark | Danmark/EU | https://www.sdu.dk/en/om-sdu/institutter-centre/imada_matematik_og_datalogi/nyt_fra_imada/ucloud-ai | ok |
| uppmax | UPPMAX | compute_gpu | Sverige | Sverige/EU | https://www.uu.se/centrum/uppmax/om-oss | ok |
| liminity | Liminity | inference_api | Sverige | Sverige/EU | https://www.liminity.se/molntjanster/ai-plattform | ok |
| obenet | Obenet | hosting | Sverige | Sverige/EU | https://www.obe.net/en/foretag/datacenter | ok |

## Osäkra dubbletter — kräver människa

### uppmax

- Kartan har redan C3SE, HPC2N, LUNARC, NSC och PDC som egna poster men inte UPPMAX. Varför? Antingen är UPPMAX ett förbiseende, eller så finns en regel om vilka centra som räknas. Regeln bör skrivas ner innan posten flyttas in.
- UPPMAX är inte ett eget juridiskt subjekt. Posten blir därför en avdelning under Uppsala universitet, till skillnad från de flesta andra poster i infra.
- Pelle är finansierad av Uppsala universitet och inte en NAISS-resurs. Tillgången för utomstående är därför oklar och bör inte antas.
- Möjlig dubblett: ai-for-research-uu (org_number). Människa avgör.
- Möjlig dubblett mot: ai-for-research-uu (org_number: 2021002932 delas med AI for Research, Uppsala universitet, men namnen liknar inte varandra (0.05))

## Öppna frågor per post

Frågorna är inte hinder. De är det som ska avgöras innan en post flyttas in.

### sval-compute

- Vilket juridiskt subjekt driver tjänsten? Sajten namnger personer men inget bolag. Är det en enskild firma? Om ja tas posten inte emot av kartan, som kräver att personen själv lägger till den.
- robots.txt på svalcompute.com gick inte att hämta (404 eller nätverksfel). Sidan lästes enligt konservativ tolkning. Kontrollera manuellt innan intag.
- Åtkomst ges bara på förfrågan. Ingen prislista finns, så pris går inte att jämföra.

### kepler-cloud

- Motsägelse i egen källa: /en/llm/ skriver att H100-klass "is on the roadmap" medan /gpu/ skriver att 8× H100 80 GB står i racket idag. En av sidorna är inaktuell. Fråga leverantören vilken som gäller innan kapacitetsfältet sätts.
- Allabolag anger 1 anställd och SNI 63100 hosting, medan sajten beskriver en flotta på 15 GPU-enheter och egen drift. Inte en motsägelse i sig, men värt att stämma av.
- Ingen zero retention- eller no training-policy hittad. Suveränitetsprofilen är därför tunnare än de svenska konkurrenternas.

### binero

- Lagerfrågan: Binero är en bred IaaS där GPU är en instanstyp. Ska de ligga som compute_gpu i infra (som GleSYS, Elastx, Safespring) eller som det föreslagna hosting-lagret? Det avgör om de är direkt jämförbara.
- Ingen prislista för GPU-instanser hittades i den publika HTML:en. Pris går inte att fylla i utan att öppna kalkylatorn.

### cerebro-cloud

- Kapacitetssiffrorna (2, 4 och 12 MW) kommer från Cerebros egen sajt och ett PDF-dokument. De är claimed, inte confirmed — ingen oberoende källa finns.
- Cerebro Cloud är ett varumärke, Barrage Nordx AB är subjektet. Frågan till infra: ska posten heta varumärket eller bolaget? ai-infra använder varumärke (t.ex. Berget AI för Berget AI AB).
- Är Hydrocompute 1 verkligen samma fysiska anläggning som Hydro66 byggde i Boden? Northern Data förvärvade Hydro66 2021. Släktskapet är inte verifierat och påstås inte här.

### upcloud

- UpCloud är i grunden ett allmänt molnbolag, som Binero. Ska de ligga som compute_gpu eller i det föreslagna hosting-lagret? Samma fråga som för Binero, och svaret bör vara detsamma för båda.
- Ingen zero retention- eller no training-policy hittad för GPU-tjänsten. Det går inte att säga att data raderas bara för att den stannar i Finland.

### telenor-ai-factory

- Ingen zero retention- eller no training-uttalelse hittad på telenoraifactory.no, trots att hela säljargumentet är känsliga data. Det bör efterfrågas innan suveränitetsfälten fylls i.
- Norrsk datacenterkapacitet (40 MW) är en pressuppgift om Skygard, inte om Telenor AI Factory. Blanda inte ihop anläggningen med tjänsten.
- Ska Telenor AI Factory räknas som en egen organisation eller som en produktrad under Telenor? ai-infra skulle behöva ett beslut, eftersom id:t blir permanent.

### polartix

- Bolaget är knappt två år gammalt och registrerat som IT-konsult, inte som datacenteroperatör. Sajten beskriver ett eget bergrum — men inget org.nr, ingen ort och ingen kundreferens finns offentligt. Verifiera anläggningen innan kapacitet skrivs in.
- NSM-dimensionerad är ett starkt anspråk som inte är verifierat mot någon certifiering eller ackreditering i källan. Ska stå som claimed, aldrig confirmed, tills ett dokument visas.

### net-zero-compute

- Det finns fyra norska bolag med Net Zero-namn i Brønnøysund (Compute, AS, Holding, Marine). Vilket som äger anläggningen i Glomfjord är inte utrett — org.nr avser Net Zero Compute AS, men koncernkopplingen är oklar.
- Sajten nämner att kundernas egna Claude-anrop går till Anthropic utanför den suveräna miljön. Det är en ärlig nyans som bör följa med i en jämförelse, inte tigas bort.

### hunex

- Bolaget registrerades 2026-07-01, alltså knappt fyra månader innan den här körningen, med 20 000 DKK i kapital. Sajten visar priser och en flotta på H100 till B300. Verifiera att kapaciteten finns innan något kapacitetsfält sätts — ålder och kapital säger inget om det ena eller andra, men de säger att inget är bevisat än.
- Sajten märker ISO 27001 med asterisk utan att förklara vad asterisken betyder. Certifiering ska inte skrivas in förrän certifikatet är sett.
- Datacenterorten anges inte, bara att anläggningen flyttas till kraftproduktion. Det gör data_location svagare än den ser ut.

### scan-net

- ScanNet och llmfactory.ai är samma CVR (29412006) och numera samma registrerade namn, team.blue Denmark A/S. Ska de vara en post eller två? ai-infra har precedent för flera poster per bolag när produkterna ligger i olika lager (gdm-ai, gdm-gpu, gdm-eneo). Här är llmfactory.ai dessutom bara öppen för gruppens interna behov, med publik API aviserad utan datum — vilket talar för en post.
- llmfactory.ai:s API är i beta och begränsat till interna användningsfall. Publik inferens är planerad men utan datum. Det är planned, inte live.
- Datacenterorten för GPU-noderna anges inte, bara antalet anläggningar.

### unit-it

- CVR 15660945 är bekräftat mot två källor (egen sida och Proff.dk) men inte slaget i CVR-registret direkt. Det räcker för claimed, inte för confirmed.
- Bolaget är i grunden en MSP som driftar andras IT, inte en infrastrukturoperatör med egen hårdvara. Frågan är om det passar lagret hosting eller om det är ett konsultbolag som bör lämnas utanför.

### sigma2

- Sigma2 motsvarar NAISS i Sverige, som redan finns på kartan. Ska båda nationella e-infrastrukturer vara med, eller bara de svenska? Geografin säger Norden, men praxis i kartan har varit Sverige.
- KI-fabrikken är Norges del av LUMI AI Factory och bygger delvis på europeisk kapacitet. Det gör gränsen mellan nationell och europeisk resurs suddig — värt ett beslut innan posten flyttas in.

### csc

- LUMI ägs av EuroHPC och elva länder, däribland Sverige. Räknas CSC då som nordisk leverantör av en europeisk resurs, eller som europeisk? Det påverkar om posten hör hemma i en nordisk karta alls.
- LUMI-AI är planerat till andra halvåret 2027 och ska ge tiofaldig AI-kapacitet. Det är planned. Ingen kapacitetssiffra för LUMI-AI får skrivas som befintlig.
- Finsk nationell HPC är gratis för akademi och subventionerad för SMF. Det gör prisjämförelse mot kommersiella leverantörer missvisande om subventionen inte syns.

### ucloud-ai

- Vid lanseringen var tjänsten öppen för forskare och studenter vid Danmarks åtta universitet. Företag och organisationer är aviserade men släppta ännu inte in enligt källan. Tillgänglighet för utomstående är alltså planned, inte live.
- Gefion, Danmarks nationella AI-superdator som ägs av DCAI, nås via UCloud enligt ett avtal. Gefion är en egen organisation och hittades inte som egen post i den här batchen — den bör prövas separat.
- BITTEN ägs av SDU tillsammans med Danfoss och HPE. Det gör att anläggningen delvis är industrifinansierad, vilket är relevant för ett suveränitetsfält men inte utrett här.

### liminity

- Liminity är i grunden ett hostingbolag med AI som en av flera tjänster, som Binero och UpCloud. Samma lagerfråga som för dem.
- Ingen DPA är publicerad, bara ett påstående om att personuppgiftsbiträdesavtal tecknas. Zero retention får därför inte skrivas som vare sig ja eller nej — det är oresearchat, inte nej.
- Sajten uppger hundratals miljarder tokens i månaden i egen drift. Den siffran är leverantörens och ska inte in i ett kapacitetsfält utan källa som visar den.

### obenet

- ISO 27001 anges som 'certification in progress' i båda hallarna. Det är planned, inte uppnått, och får inte skrivas som en certifiering förrän certifikatet finns.
- Obenet säljer inte GPU eller inferens. Posten hör bara hemma i infra om colocation räknas som ett lager. Det är ett principbeslut, inte en detalj — samma fråga gäller Cerebro Cloud.
- Datacenterverksamheten kan ligga i dotterbolaget Obehosting AB (556964-4973), inte i Obenet AB, trots att sajten säger att de äger och driver hallarna. Red ut vilket bolag som ska bära posten.

## Fynd utöver kandidaterna

Saker som inte är kandidater men som påverkar databaserna. De står här
eftersom de annars bara finns i körloggen.

### allabolag.se svarar 403 för research-User-Agent

Alla tre allabolag-länkar i batch 01 gav 403 vid maskinell kontroll. En källa som inte går att hämta kan inte bära en post som ska vara kontrollerbar, även om uppgiften är riktig. Bytt till letabolag.se, som speglar samma uppgifter ur Bolagsverket och svarar 200. Regeln står nu i config/sources.json under SE.

Berör: `config/sources.json`

### Delat org.nr bevisar juridiskt subjekt, inte organisatorisk enhet

UPPMAX avvisades först som dubblett av ai-for-research-uu eftersom båda har org.nr 202100-2932. Men det numret är Uppsala universitet, och de två är helt olika verksamheter: ett HPC-centrum och en forskningssatsning. Regeln är ändrad så att org.nr ensamt ger osäker dubblett, medan org.nr plus namnlikhet ger dubblett. Lärosäten, kommuner och stora bolag har många enheter under ett nummer.

Berör: `scripts/lib/dedupe.mjs`

### Airon finns i ai-infra utan org.nr — Bergets DPA fyller luckan

Berget AI:s personuppgiftsbiträdesavtal anger AI Iron AB, org.nr 559490-8054, som underbiträde för GPU bare-metal. ai-infra har posten airon men utan organisationsnummer. Numret är inte lagt till av den här pipelinen eftersom infra inte skrivs till, men det är en rättelse som väntar.

Berör: `opensverige-ai-infra`

### Samma organisation har två id:n i baslinjen

ai-infra och ai-kartan använder olika id för samma bolag: mimer (infra) och sweden-ai-factory (kartan), båda med domänen swedenaifactory.se. Samma sak för opper och opper-ai, båda med opper.ai. Baslinjen slår ihop på id och visar dem därför som två poster var. Det påverkar inte den här körningen eftersom domänmatchningen fångar dem, men det gör baslinjen svårare att läsa.

Berör: `state/baseline.json`

### NAISS nya system Arrhenius nämns inte på kartan

NAISS finns på ai-kartan, men det nya systemet Arrhenius (382 GPU-noder med 4× NVIDIA GH200 var, i produktion från 2026-07-01, ersätter Alvis och Mimer) nämns inte. Det är Sveriges största GPU-resurs och därmed den enskilt viktigaste uppgiften som saknas om nationell kapacitet.

Berör: `opensverige/ai-kartan`

### MCP-lagret i Norden är dataåtkomst, inte infrastruktur

4 000 poster ur det officiella MCP-registret gav 1 164 unika servrar och noll med nordiskt domänprefix. Sökning på länder och städer gav en träff, en kunskapsbas för prefabricerade hus. GitHub gav dataåtkomst-servrar för Riksdagen, SCB, Kolada, Skolverket, Avanza och nordiska bolagsregister, alla byggda av enskilda utvecklare ovanpå öppna data. Inga nordiska infrastrukturoperatörer publicerar egna MCP-servrar. Att MCP nämns som ett lager i databasen betyder alltså stöd i en produkt, inte en egen kategori av organisationer.

Berör: `scope`

### A/S ScanNet och team.blue Denmark A/S är samma juridiska person

ScanNets egna villkor anger CVR 29412006, och samma nummer tillhör team.blue Denmark A/S i CVR-registret, med Skanderborg som säte. Därmed är också llmfactory.ai samma organisation. De slogs ihop till en post. ai-infra har precedent för flera poster per bolag när produkterna ligger i olika lager, så en uppdelning är möjlig men bör beslutas av en människa.

Berör: `data/candidates-2026-10-26.json`

### Cerebro Clouds anläggning i Boden kan vara Hydro66:s gamla

Northern Data förvärvade Hydro66:s datacenter i Boden i mars 2021. Cerebro Cloud driver Hydrocompute 1–3 på samma ort. Släktskapet är inte verifierat och påstås inte i posten, men det bör redas ut innan kapacitetssiffror jämförs med historiska Hydro66-siffror (19,2 MW år 2018).

Berör: `data/candidates-2026-10-26.json`

## Frågefamiljer

| Familj | Körningar | Nya | Tomma i rad |
|---|---|---|---|
| Svensk inferens och GPU | 1 | 4 | 0 |
| Nordisk sovereign cloud och hosting | 1 | 7 | 0 |
| MCP-servrar med nordisk avsändare | 1 | 0 | 1 |
| Suveränitet och compliance | 1 | 2 | 0 |
| Nationell HPC och AI-fabriker | 1 | 4 | 0 |
| Registerverifiering | 1 | 0 | 0 |

## Nästa steg

1. Granska "Kräver människa" först. En osäker dubblett är billig att avgöra nu
   och dyr att upptäcka efter intag.
2. Kör `node scripts/qc.mjs --strict` efter varje rättelse.
3. Intag i `opensverige-ai-infra` sker för hand, enligt den databasens egen
   intagsväg. Nya lager (`mcp_server`, `hosting`, `sovereign_cloud`) kräver
   beslut om schemaändring innan de kan flyttas in.

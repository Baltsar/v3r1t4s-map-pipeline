#!/usr/bin/env node
// Sammanfattningen. Skrivs för en människa som öppnar filen nästa morgon och
// vill veta tre saker: vad hittades, vad är osäkert, och varför slutade den.
//
// Ingen rankning. Ingen rekommendation. Bara vad posterna säger och var de
// kommer ifrån.

import { writeFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { PATHS, lasConfig, idag, runDir, readJsonSafe, candidatesFil } from './lib/paths.mjs';
import { lasSeen } from './lib/log.mjs';

const scope = lasConfig('scope.json');
const datum = idag();
const dir = runDir(datum);
const fil = readJsonSafe(candidatesFil(datum), { candidates: [] });
const seen = existsSync(join(dir, 'seen.json')) ? lasSeen(datum) : { families: {}, rejected: [] };
const avvisade = readJsonSafe(join(dir, 'rejected.json'), { rejected: [] });

const batchar = existsSync(dir)
  ? readdirSync(dir)
      .filter((f) => /^batch-\d+\.json$/.test(f))
      .sort()
      .map((f) => readJsonSafe(join(dir, f)))
      .filter(Boolean)
  : [];

const poster = fil.candidates ?? [];

const perLager = new Map();
for (const p of poster) {
  const l = p.layer?.value ?? 'okänt';
  perLager.set(l, (perLager.get(l) ?? 0) + 1);
}

const perLand = new Map();
for (const p of poster) {
  const land = p.sovereignty?.country_hq?.value ?? 'okänt';
  perLand.set(land, (perLand.get(land) ?? 0) + 1);
}

const perStatus = { confirmed: 0, claimed: 0, planned: 0, unknown: 0 };
for (const p of poster) {
  for (const f of [p.name, p.layer, ...Object.values(p.sovereignty ?? {})]) {
    if (f && perStatus[f.status] !== undefined) perStatus[f.status]++;
  }
}

const osakra = poster.filter((p) => p.dedupe?.verdict === 'ambiguous');
const medFragor = poster.filter((p) => (p.questions ?? []).length > 0);
const antalFragor = poster.reduce((s, p) => s + (p.questions ?? []).length, 0);
const underkanda = poster.filter((p) => p.qc && p.qc.passed === false);

const stangda = batchar.filter((b) => b.status === 'closed');
const först = batchar[0]?.started_at ?? null;
const timmar = först ? (Date.now() - new Date(först).getTime()) / 3_600_000 : 0;

const stopp = readJsonSafe(join(dir, 'stopp.json'), null);

const stopporsak = (() => {
  if (stopp?.reason) return stopp.automatic_condition ?? stopp.reason;
  if (poster.length >= scope.stop.maxCandidates) return `kandidattaket nått (${scope.stop.maxCandidates})`;
  const uttomda = scope.families
    .filter((f) => f.discovery !== false)
    .filter((f) => (seen.families[f.id]?.empty_streak ?? 0) >= scope.stop.emptyBatchesInARow);
  if (uttomda.length) return `frågefamiljer uttömda: ${uttomda.map((f) => f.id).join(', ')}`;
  if (timmar >= scope.stop.maxHours) return `tidsgränsen (${scope.stop.maxHours} h)`;
  return null;
})();

const L = [];
L.push(`# Kandidater ${datum}`, '');
L.push(`Genererad av v3r1t4s-map-pipeline ${new Date().toISOString()}.`, '');
L.push('Kandidater, inte intag. En post här är verifierad mot sin källa men inte');
L.push('granskad av en människa. Ingenting skrivs in i `opensverige-ai-infra` eller');
L.push('`opensverige/ai-kartan` av den här pipelinen.', '');

L.push('## Sammanfattning', '');
L.push(`- Kandidater: **${poster.length}**`);
L.push(`- Batchar: ${stangda.length} stängda av ${batchar.length}`);
L.push(`- Avvisade: ${avvisade.rejected.length} (sparade med orsak i \`runs/${datum}/rejected.json\`)`);
L.push(`- Osäkra dubbletter, kräver människa: ${osakra.length}`);
L.push(`- Poster med öppna frågor: ${medFragor.length} (${antalFragor} frågor)`);
L.push(`- Underkända i QC: ${underkanda.length}`);
if (först) L.push(`- Körtid: ${timmar.toFixed(1)} h`);
L.push(`- Stopporsak: ${stopporsak ?? 'körningen pågår'}`);
if (stopp && !stopp.automatic_condition) {
  L.push('- Stoppet var inte ett automatiskt villkor. Sökandet är inte uttömt — se `runs/' + datum + '/stopp.json`.');
}
L.push('');

L.push('## Per lager', '');
for (const [l, n] of [...perLager.entries()].sort((a, b) => b[1] - a[1])) {
  const förslag = scope.layers.proposed.includes(l) ? ' (förslag utanför infra-enumet)' : '';
  L.push(`- ${l}: ${n}${förslag}`);
}
L.push('');

L.push('## Per hemvist', '');
for (const [l, n] of [...perLand.entries()].sort((a, b) => b[1] - a[1])) L.push(`- ${l}: ${n}`);
L.push('');

L.push('## Statusfördelning på fält', '');
L.push(`- confirmed: ${perStatus.confirmed}`);
L.push(`- claimed: ${perStatus.claimed}`);
L.push(`- planned: ${perStatus.planned}`);
L.push(`- unknown: ${perStatus.unknown}`);
L.push('');
L.push('`confirmed` betyder att fältet står i en källa som inte är organisationen själv.');
L.push('Egen webbplats ger högst `claimed`, hur säkert det än låter.', '');

L.push('## Kandidater', '');
L.push('| Id | Namn | Lager | Hemvist | Suveränitet | Källa | QC |');
L.push('|---|---|---|---|---|---|---|');
for (const p of poster) {
  const namn = p.name?.value ?? '';
  const lager = p.layer?.value ?? '';
  const hemvist = p.sovereignty?.country_hq?.value ?? '—';
  const suv = p.sovereignty?.ownership_jurisdiction?.value ?? '—';
  const kalla = (p.sources ?? [])[0]?.url ?? '—';
  const qc = p.qc?.passed === false ? 'underkänd' : p.qc?.passed ? 'ok' : '—';
  L.push(`| ${p.id} | ${namn} | ${lager} | ${hemvist} | ${suv} | ${kalla} | ${qc} |`);
}
L.push('');

if (osakra.length) {
  L.push('## Osäkra dubbletter — kräver människa', '');
  for (const p of osakra) {
    L.push(`### ${p.id}`, '');
    for (const q of p.questions ?? []) L.push(`- ${q}`);
    L.push(`- Möjlig dubblett mot: ${p.dedupe.matches.map((m) => `${m.id} (${m.kind}${m.detail ? `: ${m.detail}` : ''})`).join(', ')}`);
    L.push('');
  }
}

if (medFragor.length) {
  L.push('## Öppna frågor per post', '');
  L.push('Frågorna är inte hinder. De är det som ska avgöras innan en post flyttas in.');
  L.push('');
  for (const p of medFragor) {
    if (p.dedupe?.verdict === 'ambiguous') continue;
    L.push(`### ${p.id}`, '');
    for (const q of p.questions) L.push(`- ${q}`);
    L.push('');
  }
}

if (underkanda.length) {
  L.push('## Underkända i QC', '');
  for (const p of underkanda) {
    L.push(`### ${p.id}`, '');
    for (const i of p.qc.issues ?? []) L.push(`- ${i}`);
    L.push('');
  }
}

const fynd = readJsonSafe(join(dir, 'fynd.json'), { findings: [] });

if (fynd.findings?.length) {
  L.push('## Fynd utöver kandidaterna', '');
  L.push('Saker som inte är kandidater men som påverkar databaserna. De står här');
  L.push('eftersom de annars bara finns i körloggen.', '');
  for (const f of fynd.findings) {
    L.push(`### ${f.title}`, '');
    L.push(f.detail, '');
    L.push(`Berör: \`${f.affects}\``, '');
  }
}

L.push('## Frågefamiljer', '');
L.push('| Familj | Körningar | Nya | Tomma i rad |');
L.push('|---|---|---|---|');
for (const f of scope.families) {
  const s = seen.families[f.id] ?? { runs: 0, new: 0, empty_streak: 0 };
  L.push(`| ${f.label} | ${s.runs} | ${s.new ?? 0} | ${s.empty_streak} |`);
}
L.push('');

if (avvisade.rejected.length) {
  L.push('## Avvisade', '');
  L.push('| Id | Namn | Orsak |');
  L.push('|---|---|---|');
  for (const a of avvisade.rejected) {
    L.push(`| ${a.id ?? '—'} | ${a.name?.value ?? a.name ?? '—'} | ${a.rejection ?? '—'} |`);
  }
  L.push('');
}

L.push('## Nästa steg', '');
L.push('1. Granska "Kräver människa" först. En osäker dubblett är billig att avgöra nu');
L.push('   och dyr att upptäcka efter intag.');
L.push('2. Kör `node scripts/qc.mjs --strict` efter varje rättelse.');
L.push('3. Intag i `opensverige-ai-infra` sker för hand, enligt den databasens egen');
L.push('   intagsväg. Nya lager (`mcp_server`, `hosting`, `sovereign_cloud`) kräver');
L.push('   beslut om schemaändring innan de kan flyttas in.');
L.push('');

const mdPath = join(PATHS.data, `candidates-${datum}.md`);
writeFileSync(mdPath, L.join('\n'), 'utf8');

console.log(`Sammanfattning skriven: ${mdPath}`);
console.log(`  ${poster.length} kandidater, ${avvisade.rejected.length} avvisade, ${osakra.length} osäkra, ${underkanda.length} underkända`);
if (stopporsak) console.log(`  stopporsak: ${stopporsak}`);

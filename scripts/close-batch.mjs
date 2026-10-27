#!/usr/bin/env node
// Stänger en batch: validerar, dubblettkontrollerar, mergar och loggar.
//
// Den här filen vägrar göra tre saker, och det är medvetet:
//   1. Skriva en post som inte validerar.
//   2. Skriva en post vars domän redan finns i baslinjen.
//   3. Skriva en dubblett utan att säga det i körloggen.
//
// Avvisade poster sparas med orsak i runs/<datum>/rejected.json. En post som
// försvinner tyst är värre än en post som aldrig skrevs.

import { writeFileSync, readFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { PATHS, lasConfig, idag, runDir, readJsonSafe, candidatesFil } from './lib/paths.mjs';
import { säkerställRunDir, logga, loggRubrik, lasSeen, sparaSeen, markeraSedd, markeraAvvisad, bokforFamilj } from './lib/log.mjs';
import { valideraKandidat, schemaFinns } from './lib/validate.mjs';
import { dedupa, doman } from './lib/dedupe.mjs';

const scope = lasConfig('scope.json');
const datum = idag();
const dir = säkerställRunDir(datum);

const argv = process.argv.slice(2);
const batchArg = argv.find((a) => /^\d+$/.test(a));
const torrkörning = argv.includes('--torr');

// ── hitta batchen ─────────────────────────────────────────────────────────
const batchFiler = readdirSync(dir).filter((f) => /^batch-\d+\.json$/.test(f)).sort();
let batchPath = null;
let batch = null;

if (batchArg) {
  batchPath = join(dir, `batch-${String(batchArg).padStart(2, '0')}.json`);
  batch = readJsonSafe(batchPath);
} else {
  // Senast öppna batch.
  for (const f of batchFiler.reverse()) {
    const b = readJsonSafe(join(dir, f));
    if (b && b.status === 'open') {
      batch = b;
      batchPath = join(dir, f);
      break;
    }
  }
}

if (!batch || !batchPath) {
  console.error('Ingen öppen batch hittades. Kör start-batch.mjs först.');
  process.exit(1);
}

schemaFinns();

const baseline = readJsonSafe(join(PATHS.state, 'baseline.json'), null);
if (!baseline) {
  console.error('state/baseline.json saknas. Kör index-baseline.mjs först.');
  process.exit(1);
}

const seen = lasSeen(datum);

// Domäner som redan finns i dagens kandidatfil räknas också som tagna.
const dagensFil = readJsonSafe(candidatesFil(datum), { candidates: [] });
const tagnaIdag = new Set((dagensFil.candidates ?? []).map((c) => c.id));
const tagnaDomaner = new Set((dagensFil.candidates ?? []).map((c) => doman(c.website)).filter(Boolean));
const tagnaOrgNr = new Set(
  (dagensFil.candidates ?? []).map((c) => c.org_number?.value).filter(Boolean).map((v) => String(v).replace(/\D/g, '')),
);

const godkanda = [];
const avvisade = [];
const problem = [];

for (const kandidat of batch.candidates ?? []) {
  // 1. Struktur och status först — det är billigast och fångar de flesta felen.
  const v = valideraKandidat(kandidat);
  if (!v.ok) {
    problem.push(`${kandidat?.id ?? '(utan id)'}: ${v.errors.join('; ')}`);
    continue;
  }

  // 2. Dubblett mot baslinjen.
  const d = dedupa(
    {
      id: kandidat.id,
      name: kandidat.name?.value,
      website: kandidat.website,
      org_number: kandidat.org_number?.value,
    },
    baseline,
  );

  if (d.verdict === 'duplicate') {
    const match = d.matches[0];
    avvisade.push({
      ...kandidat,
      rejection: `finns redan i baslinjen som ${match.id} (${match.kind}${match.detail ? `: ${match.detail}` : ''})`,
    });
    logga('avvisad', `${kandidat.id} — dubblett av ${match.id} via ${match.kind}`);
    continue;
  }

  // 3. Dubblett inom dagen.
  const dom = doman(kandidat.website);
  if (tagnaIdag.has(kandidat.id) || (dom && tagnaDomaner.has(dom))) {
    avvisade.push({ ...kandidat, rejection: `redan skriven i dag (id eller domän ${dom})` });
    logga('avvisad', `${kandidat.id} — redan skriven i dag`);
    continue;
  }
  const org = String(kandidat.org_number?.value ?? '').replace(/\D/g, '');
  if (org && tagnaOrgNr.has(org)) {
    avvisade.push({ ...kandidat, rejection: `org.nr ${org} finns redan i dagens fil` });
    logga('avvisad', `${kandidat.id} — org.nr ${org} redan skriven i dag`);
    continue;
  }

  // 4. Ambiguous: namnmatchet är för svagt för att avvisa och för starkt för
  // att tiga om. Posten släpps igenom men märks, så en människa ser den.
  if (d.verdict === 'ambiguous') {
    kandidat.dedupe = {
      ...kandidat.dedupe,
      verdict: 'ambiguous',
      matches: d.matches.map((m) => ({ id: m.id, kind: m.kind, ...(m.detail ? { detail: m.detail } : {}) })),
    };
    kandidat.questions = [
      ...(kandidat.questions ?? []),
      `Möjlig dubblett: ${d.matches.map((m) => `${m.id} (${m.kind})`).join(', ')}. Människa avgör.`,
    ];
    logga('osäker dubblett', `${kandidat.id} — ${d.matches.map((m) => m.id).join(', ')}`);
  }

  godkanda.push(kandidat);
  tagnaIdag.add(kandidat.id);
  if (dom) tagnaDomaner.add(dom);
  if (org) tagnaOrgNr.add(org);
  markeraSedd(seen, dom, { name: kandidat.name?.value ?? null, id: kandidat.id });
}

if (problem.length) {
  console.error('\nBatchen kan inte stängas. Poster som inte validerar:\n');
  for (const p of problem) console.error(`  - ${p}`);
  console.error('\nRätta posterna i batchen och kör om. Inget skrevs.');
  process.exit(1);
}

// ── skriv ─────────────────────────────────────────────────────────────────
if (torrkörning) {
  console.log(`[torr] ${godkanda.length} skulle skrivas, ${avvisade.length} avvisas.`);
  for (const a of avvisade) console.log(`  avvisad: ${a.id} — ${a.rejection}`);
  process.exit(0);
}

const nyFil = {
  version: 1,
  date: datum,
  generated_at: new Date().toISOString(),
  baseline: {
    generated_at: baseline.generated_at,
    counts: baseline.counts,
  },
  counts: {
    total: (dagensFil.candidates?.length ?? 0) + godkanda.length,
    ambiguous: [...(dagensFil.candidates ?? []), ...godkanda].filter((c) => c.dedupe?.verdict === 'ambiguous').length,
    last_batch: batch.batch,
    last_batch_new: godkanda.length,
    last_batch_rejected: avvisade.length,
  },
  candidates: [...(dagensFil.candidates ?? []), ...godkanda],
};

mkdirSync(PATHS.data, { recursive: true });
writeFileSync(candidatesFil(datum), JSON.stringify(nyFil, null, 2) + '\n', 'utf8');

// Avvisade sparas separat, med orsak. Aldrig tyst bort.
if (avvisade.length) {
  const rejPath = join(dir, 'rejected.json');
  const befintliga = readJsonSafe(rejPath, { rejected: [] });
  writeFileSync(
    rejPath,
    JSON.stringify({ rejected: [...befintliga.rejected, ...avvisade] }, null, 2) + '\n',
    'utf8',
  );
}

// ── stäng batchen ─────────────────────────────────────────────────────────
batch.status = 'closed';
batch.closed_at = new Date().toISOString();
batch.outcome = {
  new: godkanda.length,
  rejected: avvisade.length,
  ambiguous: godkanda.filter((c) => c.dedupe?.verdict === 'ambiguous').length,
};
writeFileSync(batchPath, JSON.stringify(batch, null, 2) + '\n', 'utf8');

bokforFamilj(seen, batch.family, {
  nya: godkanda.length,
  dubbletter: avvisade.filter((a) => a.rejection.includes('finns redan i baslinjen')).length,
  avvisade: avvisade.length,
  raknaTom: scope.families.find((f) => f.id === batch.family)?.discovery !== false,
});
sparaSeen(seen, datum);

loggRubrik(`batch-${batch.batch} — ${batch.family_label}`);
logga('batch stängd', `nya ${godkanda.length}, avvisade ${avvisade.length}, osäkra ${batch.outcome.ambiguous}`);
for (const k of godkanda) logga('kandidat', `${k.id} — ${k.name.value} (${k.layer.value})`);

// ── utfall ────────────────────────────────────────────────────────────────
console.log(`Stängde batch-${batch.batch} (${batch.family_label}).`);
console.log(`  nya kandidater : ${godkanda.length}`);
console.log(`  avvisade       : ${avvisade.length}`);
console.log(`  osäkra        : ${batch.outcome.ambiguous}`);
console.log(`  fil           : ${candidatesFil(datum)}`);

const streak = seen.families[batch.family]?.empty_streak ?? 0;
if (godkanda.length === 0) {
  console.log(`\nNoll nya. Familjen har nu ${streak} tomma körningar i rad (tak: ${scope.stop.emptyBatchesInARow}).`);
}

const totalt = nyFil.candidates.length;
if (totalt >= scope.stop.maxCandidates) {
  console.log(`\nSTOPP: ${totalt} kandidater är fler än taket ${scope.stop.maxCandidates}.`);
} else if (streak >= scope.stop.emptyBatchesInARow) {
  console.log(`\nSTOPP: familjen är uttömd. Kör status.mjs för helhetsbilden.`);
}

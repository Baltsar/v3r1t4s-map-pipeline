#!/usr/bin/env node
// Bygger baslinjen: alla organisationer som redan finns, så pipelinen aldrig
// presenterar en känd aktör som ny.
//
// Tre källor, olika format, samma utdata. En post är:
//   { id, name, domain, org_number, source }
//
// Källor som inte går att nå loggas men fäller inte körningen — en natt utan
// ai-infra-API ska fortfarande kunna köra mot ai-kartan.

import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { PATHS, lasConfig, idag } from './lib/paths.mjs';
import { hamtaJson } from './lib/http.mjs';
import { hamtaPrivatJson } from './lib/gh.mjs';
import { lasKartanPost } from './lib/yaml-lite.mjs';
import { doman, orgNr } from './lib/dedupe.mjs';

const konfig = lasConfig('sources.json');
const poster = new Map(); // id -> post, så samma org från två källor blir en
const status = [];

function laggTill(post) {
  if (!post.id) return;
  const befintlig = poster.get(post.id);
  if (befintlig) {
    for (const k of ['name', 'domain', 'org_number', 'website']) {
      if (!befintlig[k] && post[k]) befintlig[k] = post[k];
    }
    befintlig.sources = [...new Set([...(befintlig.sources ?? []), post.source])];
    return;
  }
  poster.set(post.id, { ...post, sources: [post.source] });
}

// ── ai-infra API ──────────────────────────────────────────────────────────
async function franInfra() {
  const { data, res } = await hamtaJson(konfig.baseline['ai-infra'].url);
  if (!data) {
    status.push({ kalla: 'ai-infra', ok: false, error: res.error ?? `HTTP ${res.status}` });
    return 0;
  }
  const providers = data.providers ?? [];
  for (const p of providers) {
    laggTill({
      id: p.id,
      name: p.name ?? null,
      website: p.website ?? null,
      domain: doman(p.website),
      org_number: orgNr(p.ownership?.org_number?.value ?? p.org_number?.value ?? null),
      layer: p.category ?? null,
      source: 'ai-infra',
    });
  }
  status.push({ kalla: 'ai-infra', ok: true, antal: providers.length, version: data.version ?? null });
  return providers.length;
}

// ── ai-infras parkerade kandidater ────────────────────────────────────────
async function franInfraKandidater() {
  const kalla = konfig.baseline['ai-infra-kandidater'];

  // Publik raw först (fungerar om repot någon gång blir öppet), sedan gh.
  let data = null;
  let via = null;
  if (kalla.url) {
    const r = await hamtaJson(kalla.url);
    if (r.data) {
      data = r.data;
      via = 'raw';
    }
  }
  if (!data && kalla.github) {
    const privat = hamtaPrivatJson(kalla.github.repo, kalla.github.path);
    if (privat) {
      data = privat;
      via = 'gh';
    }
  }

  if (!data) {
    status.push({
      kalla: 'ai-infra-kandidater',
      ok: false,
      error: 'kunde inte läsas via raw eller gh — dubblettkontrollen mot parkerade kandidater är avstängd',
    });
    return 0;
  }

  const kandidater = data.candidates ?? [];
  for (const c of kandidater) {
    laggTill({
      id: c.id,
      name: c.name ?? null,
      website: c.website ?? null,
      domain: doman(c.website),
      org_number: orgNr(c.ownership?.org_number ?? null),
      layer: c.proposed_category ?? null,
      source: 'ai-infra-kandidat',
      parked: true,
    });
  }
  status.push({ kalla: 'ai-infra-kandidater', ok: true, antal: kandidater.length, via });
  return kandidater.length;
}

// ── ai-kartan (lokal checkout) ────────────────────────────────────────────
function franKartan() {
  const katalog = join(PATHS.root, konfig.baseline['ai-kartan'].path);
  if (!existsSync(katalog)) {
    status.push({
      kalla: 'ai-kartan',
      ok: false,
      error: `saknas: ${katalog} — klona opensverige/ai-kartan som syskonkatalog (v1/)`,
    });
    return 0;
  }
  const filer = readdirSync(katalog).filter((f) => f.endsWith('.yaml') || f.endsWith('.yml'));
  for (const f of filer) {
    const post = lasKartanPost(readFileSync(join(katalog, f), 'utf8'));
    laggTill({
      id: post.id ?? f.replace(/\.ya?ml$/, ''),
      name: post.name,
      website: post.website,
      domain: doman(post.website),
      org_number: orgNr(post.org_number),
      layer: null,
      type: post.type,
      source: 'ai-kartan',
    });
  }
  status.push({ kalla: 'ai-kartan', ok: true, antal: filer.length });
  return filer.length;
}

const antalInfra = await franInfra();
const antalKandidater = await franInfraKandidater();
const antalKartan = franKartan();

const entries = [...poster.values()].sort((a, b) => a.id.localeCompare(b.id));

mkdirSync(PATHS.state, { recursive: true });
const ut = {
  version: 1,
  generated_at: new Date().toISOString(),
  generated_on: idag(),
  counts: {
    ai_infra: antalInfra,
    ai_infra_kandidater: antalKandidater,
    ai_kartan: antalKartan,
    unika: entries.length,
    med_doman: entries.filter((e) => e.domain).length,
    med_org_number: entries.filter((e) => e.org_number).length,
  },
  sources: status,
  entries,
};

const mal = join(PATHS.state, 'baseline.json');
writeFileSync(mal, JSON.stringify(ut, null, 2) + '\n', 'utf8');

console.log(`Baslinje skriven: ${mal}`);
for (const s of status) {
  console.log(`  ${s.ok ? 'ok  ' : 'FEL '} ${s.kalla}${s.antal !== undefined ? ` — ${s.antal}` : ''}${s.error ? ` — ${s.error}` : ''}`);
}
console.log(`  unika organisationer: ${entries.length}`);
if (!status.every((s) => s.ok)) {
  console.log('\nOBS: en eller flera källor saknas. Dubblettkontrollen blir svagare. Körningen fortsätter.');
}

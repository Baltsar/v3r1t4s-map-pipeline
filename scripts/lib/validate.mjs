// Struktur- och statusvalidering. Ren funktion: inget nätverk, ingen skrivning.
//
// Den här filen är portvakten. Den ska hellre fälla en ärlig post än släppa
// igenom en påhittad. Ingenting här försöker avgöra om en organisation är bra —
// bara om posten säger vad den påstår att den säger.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PATHS } from './paths.mjs';
import { kanBekrafta, STATUS } from './fact.mjs';

const LAGER = new Set([
  'inference_api',
  'gateway_router',
  'platform_assistant',
  'compute_gpu',
  'mcp_server',
  'hosting',
  'sovereign_cloud',
]);

const BEFINTLIGA_LAGER = new Set(['inference_api', 'gateway_router', 'platform_assistant', 'compute_gpu']);

const KALLTYPER = new Set([
  'company_register',
  'regulator',
  'third_party',
  'academic',
  'infra_dataset',
  'own_site',
  'own_docs',
  'press',
  'provider_site',
  'provider_docs',
  'provider_terms',
  'pricing_page',
]);

const DATUM = /^\d{4}-\d{2}-\d{2}$/;
const ID = /^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$/;

const SUVERANITETSFALT = ['ownership_jurisdiction', 'foreign_parent', 'zero_retention', 'no_training', 'data_location'];

/** Alla Fact-fält i en post, med sökväg, så felmeddelanden pekar rätt. */
function* facts(post) {
  const kandidat = ['name', 'legal_name', 'layer', 'description', 'org_number'];
  for (const k of kandidat) {
    if (post[k] !== undefined) yield { path: k, fact: post[k], suveranitet: false };
  }
  for (const [k, v] of Object.entries(post.sovereignty ?? {})) {
    yield { path: `sovereignty.${k}`, fact: v, suveranitet: SUVERANITETSFALT.includes(k) };
  }
}

function valideraFact(path, f, { suveranitet }, fel) {
  if (!f || typeof f !== 'object' || Array.isArray(f)) {
    fel.push(`${path}: måste vara ett Fact-objekt`);
    return;
  }
  if (!('value' in f)) fel.push(`${path}: value saknas`);
  if (!STATUS.includes(f.status)) fel.push(`${path}: status "${f.status}" är inte tillåten`);

  if (f.status === 'unknown' && f.value !== null) {
    fel.push(`${path}: status unknown kräver value: null`);
  }
  if (f.status === 'not_applicable' && f.value !== null) {
    fel.push(`${path}: status not_applicable kräver value: null`);
  }

  if (f.status === 'confirmed') {
    if (!f.source_url) fel.push(`${path}: confirmed kräver source_url`);
    if (!f.verified_at) fel.push(`${path}: confirmed kräver verified_at`);
    if (!DATUM.test(f.verified_at ?? '')) fel.push(`${path}: verified_at måste vara YYYY-MM-DD`);
    if (!f.source_type) {
      fel.push(`${path}: confirmed kräver source_type`);
    } else if (!kanBekrafta(f.source_type)) {
      fel.push(`${path}: confirmed kan inte vila på ${f.source_type} — egen sida ger högst claimed`);
    }
  }

  if (f.source_type && !KALLTYPER.has(f.source_type)) {
    fel.push(`${path}: source_type "${f.source_type}" är inte tillåten`);
  }

  if (f.source_url && !/^https?:\/\//.test(f.source_url)) {
    fel.push(`${path}: source_url måste vara http(s)`);
  }
  if (f.verified_at && !DATUM.test(f.verified_at)) {
    fel.push(`${path}: verified_at måste vara YYYY-MM-DD`);
  }

  // Inga påhittade siffror: ett numeriskt värde kräver en URL som visar talet.
  if (typeof f.value === 'number' && !f.source_url) {
    fel.push(`${path}: numeriskt värde kräver source_url`);
  }

  // Suveränitet får aldrig bli confirmed ur egen marknadscopy.
  if (suveranitet && f.status === 'confirmed' && ['own_site', 'own_docs', 'press'].includes(f.source_type)) {
    fel.push(`${path}: suveränitetspåstående kan inte bli confirmed ur ${f.source_type} — kräver DPA, villkor eller regulator`);
  }
}

/**
 * Validerar en kandidatpost.
 * @returns {{ok:boolean, errors:string[]}}
 */
export function valideraKandidat(post) {
  const fel = [];

  if (!post || typeof post !== 'object') return { ok: false, errors: ['posten är inte ett objekt'] };

  if (!post.id || !ID.test(post.id)) fel.push('id: måste vara slug, 3-64 tecken, a-z 0-9 bindestreck');
  if (typeof post.website === 'string' && !/^https?:\/\//.test(post.website)) {
    fel.push('website: måste vara http(s)');
  }

  if (!post.sources || !Array.isArray(post.sources) || post.sources.length === 0) {
    fel.push('sources: minst en källa krävs');
  } else {
    post.sources.forEach((s, i) => {
      if (!s.url || !/^https?:\/\//.test(s.url)) fel.push(`sources[${i}].url: måste vara http(s)`);
      if (!s.source_type || !KALLTYPER.has(s.source_type)) fel.push(`sources[${i}].source_type är ogiltig`);
      if (!DATUM.test(s.fetched_at ?? '')) fel.push(`sources[${i}].fetched_at måste vara YYYY-MM-DD`);
      if (s.http_status !== undefined && s.http_status !== null && s.http_status !== 200) {
        fel.push(`sources[${i}]: http_status ${s.http_status} är inte 200 — döda källor får inte bära en post`);
      }
      if (s.robots_allowed === false) {
        fel.push(`sources[${i}]: robots.txt tillåter inte hämtning`);
      }
    });
  }

  if (!post.layer || !LAGER.has(post.layer.value)) {
    fel.push(`layer.value "${post.layer?.value}" är inte ett känt lager`);
  }
  if (post.layer && post.layer.value && !BEFINTLIGA_LAGER.has(post.layer.value) && post.layer_proposal !== true) {
    fel.push(`layer.value "${post.layer.value}" ligger utanför infra-enumet och kräver layer_proposal: true`);
  }
  if (post.layer?.value && !BEFINTLIGA_LAGER.has(post.layer.value) && post.layer_proposal === true) {
    // korrekt flaggat — inget fel
  } else if (post.layer?.value && BEFINTLIGA_LAGER.has(post.layer.value) && post.layer_proposal === true) {
    fel.push('layer_proposal: true men lagret finns redan i infra — sätt false');
  }

  for (const { path, fact, suveranitet } of facts(post)) {
    valideraFact(path, fact, { suveranitet }, fel);
  }

  if (post.dedupe) {
    if (!['new', 'duplicate', 'ambiguous'].includes(post.dedupe.verdict)) {
      fel.push('dedupe.verdict är ogiltig');
    }
    if (post.dedupe.verdict === 'new' && (post.dedupe.matches ?? []).length > 0) {
      fel.push('dedupe.verdict new men matches är inte tom');
    }
    if (post.dedupe.verdict === 'duplicate' && (post.dedupe.matches ?? []).length === 0) {
      fel.push('dedupe.verdict duplicate saknar matches');
    }
    if (!Array.isArray(post.dedupe.checked_against) || post.dedupe.checked_against.length === 0) {
      fel.push('dedupe.checked_against är tom');
    }
  } else {
    fel.push('dedupe saknas — dubblettkontroll är obligatorisk');
  }

  if (!DATUM.test(post.discovered_at ?? '')) fel.push('discovered_at måste vara YYYY-MM-DD');
  if (!post.batch) fel.push('batch saknas');

  return { ok: fel.length === 0, errors: fel };
}

/** Validerar en hel kandidatfil. Dubbletter på id inom filen är ett fel. */
export function valideraFil(fil) {
  const fel = [];
  if (!fil || !Array.isArray(fil.candidates)) {
    return { ok: false, errors: ['filen saknar candidates[]'] };
  }

  const sedda = new Map();
  for (const post of fil.candidates) {
    const r = valideraKandidat(post);
    for (const e of r.errors) fel.push(`${post?.id ?? '(utan id)'}: ${e}`);

    if (post?.id) {
      if (sedda.has(post.id)) {
        fel.push(`${post.id}: id förekommer två gånger i filen`);
      }
      sedda.set(post.id, true);

      if (post.dedupe?.verdict === 'duplicate') {
        fel.push(`${post.id}: en post med verdict duplicate får inte ligga i kandidatfilen`);
      }
    }
  }

  return { ok: fel.length === 0, errors: fel };
}

/** Läser schemat bara för att upptäcka att det finns och är giltig JSON. */
export function schemaFinns() {
  try {
    JSON.parse(readFileSync(join(PATHS.schema, 'candidate.schema.json'), 'utf8'));
    return true;
  } catch (err) {
    throw new Error(`schema/candidate.schema.json är trasigt: ${err.message}`);
  }
}

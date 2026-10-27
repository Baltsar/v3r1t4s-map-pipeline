// HTTP med identifierande UA, timeout och ingen retry-storm.
// Samma UA-familj som ai-infra använder, så operatörer kan känna igen trafiken.

const UA = 'OpenSverigeAIKartan-research/1 (kontakt: opensverige.se; nattlig research)';
const TIMEOUT = 15000;

const cache = new Map();

/**
 * Hämta en URL. Kastar aldrig — returnerar alltid ett objekt.
 *
 * Ett nätverksfel (status 0) försöker en gång till. En långsam myndighetssajt
 * som tajmar ut är inte en död källa, och att fälla en post för en timeout
 * vore att blanda ihop otålighet med dålig källa. HTTP-fel försöks inte om:
 * ett 403 är ett svar, inte ett avbrott.
 *
 * @returns {Promise<{ok:boolean,status:number,body:string,url:string,error?:string,finalUrl?:string,forsok?:number}>}
 */
export async function hamta(url, { json = false, timeout = TIMEOUT, useCache = true, retries = 1 } = {}) {
  if (useCache && cache.has(url)) return cache.get(url);

  let out;
  for (let forsok = 0; forsok <= retries; forsok++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeout);
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': UA,
          Accept: json ? 'application/json' : 'text/html,application/xhtml+xml,application/json;q=0.8',
          'Accept-Language': 'sv,en;q=0.8',
        },
        redirect: 'follow',
        signal: ctrl.signal,
      });
      const body = res.ok ? await res.text() : '';
      out = { ok: res.ok, status: res.status, body, url, finalUrl: res.url || url, forsok: forsok + 1 };
    } catch (err) {
      out = { ok: false, status: 0, body: '', url, error: String(err?.message ?? err), forsok: forsok + 1 };
    } finally {
      clearTimeout(timer);
    }

    if (out.status !== 0) break;
    if (forsok < retries) await new Promise((r) => setTimeout(r, 1500 * (forsok + 1)));
  }

  if (useCache) cache.set(url, out);
  return out;
}

/** Hämta och parsa JSON. Returnerar null vid fel i stället för att kasta. */
export async function hamtaJson(url, opts = {}) {
  const r = await hamta(url, { ...opts, json: true });
  if (!r.ok || !r.body) return { data: null, res: r };
  try {
    return { data: JSON.parse(r.body), res: r };
  } catch (err) {
    return { data: null, res: { ...r, ok: false, error: `JSON-fel: ${err.message}` } };
  }
}

export { UA };

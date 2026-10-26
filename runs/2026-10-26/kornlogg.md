# Körlogg 2026-10-26

Genererad av v3r1t4s-map-pipeline. En rad per händelse, i tidsordning.

| Tid | Händelse | Detalj |
|---|---|---|
| 2026-10-26T21:50:47.859Z | start | familj MCP-servrar med nordisk avsändare |
| 2026-10-26T21:50:47.859Z | batch öppnad | batch-01 — MCP-servrar med nordisk avsändare |
| 2026-10-26T21:50:56.527Z | batch öppnad | batch-01 — Svensk inferens och GPU |

## batch-01 — Svensk inferens och GPU

| 2026-10-26T21:52:50.936Z | batch stängd | nya 4, avvisade 0, osäkra 0 |
| 2026-10-26T21:52:50.936Z | kandidat | sval-compute — Sval Compute (inference_api) |
| 2026-10-26T21:52:50.936Z | kandidat | kepler-cloud — Kepler Cloud (compute_gpu) |
| 2026-10-26T21:52:50.936Z | kandidat | binero — Binero (hosting) |
| 2026-10-26T21:52:50.936Z | kandidat | cerebro-cloud — Cerebro Cloud (hosting) |
| 2026-10-26T21:52:56.405Z | qc underkänd | 3 av 4: kepler-cloud, binero, cerebro-cloud |
| 2026-10-26T21:53:28.135Z | qc godkänd | 4 poster |
| 2026-10-26T21:53:37.520Z | batch öppnad | batch-02 — Nordisk sovereign cloud och hosting |

## batch-02 — Nordisk sovereign cloud och hosting

| 2026-10-26T21:56:38.438Z | batch stängd | nya 7, avvisade 0, osäkra 0 |
| 2026-10-26T21:56:38.439Z | kandidat | upcloud — UpCloud (compute_gpu) |
| 2026-10-26T21:56:38.439Z | kandidat | telenor-ai-factory — Telenor AI Factory (sovereign_cloud) |
| 2026-10-26T21:56:38.439Z | kandidat | polartix — Polartix (sovereign_cloud) |
| 2026-10-26T21:56:38.439Z | kandidat | net-zero-compute — Net Zero Compute (hosting) |
| 2026-10-26T21:56:38.439Z | kandidat | hunex — HuneX (compute_gpu) |
| 2026-10-26T21:56:38.439Z | kandidat | scan-net — ScanNet (compute_gpu) |
| 2026-10-26T21:56:38.439Z | kandidat | unit-it — Unit IT (hosting) |
| 2026-10-26T21:56:55.047Z | qc godkänd | 11 poster |
| 2026-10-26T21:57:08.371Z | batch öppnad | batch-03 — Nationell HPC och AI-fabriker |
| 2026-10-26T21:58:26.623Z | avvisad | uppmax — dubblett av ai-for-research-uu via org_number |

## batch-03 — Nationell HPC och AI-fabriker

| 2026-10-26T21:58:26.627Z | batch stängd | nya 3, avvisade 1, osäkra 0 |
| 2026-10-26T21:58:26.627Z | kandidat | sigma2 — Sigma2 (compute_gpu) |
| 2026-10-26T21:58:26.628Z | kandidat | csc — CSC (compute_gpu) |
| 2026-10-26T21:58:26.628Z | kandidat | ucloud-ai — UCloud AI (compute_gpu) |
| 2026-10-26T21:58:49.287Z | qc godkänd | 14 poster |
| 2026-10-26T21:59:39.601Z | osäker dubblett | uppmax — ai-for-research-uu |

## batch-03 — Nationell HPC och AI-fabriker

| 2026-10-26T21:59:39.603Z | batch stängd | nya 1, avvisade 0, osäkra 1 |
| 2026-10-26T21:59:39.603Z | kandidat | uppmax — UPPMAX (compute_gpu) |
| 2026-10-26T22:00:06.941Z | qc godkänd | 15 poster |
| 2026-10-26T22:00:41.491Z | batch öppnad | batch-04 — Suveränitet och compliance |

## batch-04 — Suveränitet och compliance

| 2026-10-26T22:01:39.189Z | batch stängd | nya 2, avvisade 0, osäkra 0 |
| 2026-10-26T22:01:39.189Z | kandidat | liminity — Liminity (inference_api) |
| 2026-10-26T22:01:39.189Z | kandidat | obenet — Obenet (hosting) |
| 2026-10-26T22:02:08.410Z | qc godkänd | 17 poster |
| 2026-10-26T22:02:14.256Z | batch öppnad | batch-05 — MCP-servrar med nordisk avsändare |

## batch-05 — MCP-servrar med nordisk avsändare

| 2026-10-26T22:02:33.325Z | batch stängd | nya 0, avvisade 0, osäkra 0 |
| 2026-10-26T22:02:39.040Z | batch öppnad | batch-06 — Registerverifiering |

## batch-06 — Registerverifiering

| 2026-10-26T22:03:23.421Z | batch stängd | nya 0, avvisade 0, osäkra 0 |
| 2026-10-26T22:03:54.740Z | qc godkänd | 17 poster |
| 2026-10-26T22:04:54.442Z | stopp | Sessionen tog slut efter 6 batchar. Inget automatiskt stoppvillkor var uppfyllt: 17 kandidater av 100, 0,2 h av 6 h, och bara MCP-familjen har en tom körning i rad. Sökandet är inte uttömt — de fem discovery-familjerna hade mer kvar. |
| 2026-10-26T22:06:22.528Z | qc underkänd | 1 av 17: binero |
| 2026-10-26T22:07:00.729Z | qc godkänd | 17 poster |

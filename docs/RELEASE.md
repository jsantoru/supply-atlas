# Supply Atlas release status

This is a locally deployable Docker research demo with a production build and persistent SQLite storage. Public production deployment is not claimed: a Docker host, domain, TLS and host-level operational verification are still required in [issue #7](https://github.com/jsantoru/supply-atlas/issues/7). No paid infrastructure has been purchased. Backup/restore was explicitly removed from scope by the user.

## Delivered capability

The defining flow is product → documented part → supplier or manufacturing facility → individually scoped evidence → another product sharing that exact part. Product studio adds nine generated photorealistic illustrations, interactive layer separation, component selection and manufacturing pivots. The graph, component hierarchy, clustered map, profiles, global search, shareable URL filters, product/supplier comparison and hypothetical disruption views use the same evidence model.

The source review desk checks two licensed documentation paths, caches conditional fetches and hashes, retains attributed snapshots, and requires a human decision. Protected corrections and bundle imports validate entity resolution and reference integrity, preserve revisions, and survive restart. Built-in collection updates preserve operator corrections and report conflicts. No automated claim extraction or unreviewed promotion is implied.

## Collection

76 entities: 9 products, 24 parts/configurations, 14 companies, 3 facilities, 2 materials, plus categories, industries, regions and variants. The collection contains 33 scoped claims from 17 primary sources.

- Raspberry Pi 5, Pi 4, Pi 500, Pi 400, Pico, Pico W and Pico 2 connect through Broadcom, Raspberry Pi, Infineon, TSMC, Renesas, VIA Labs, Winbond and Abracon observations.
- Mac Pro 2019 connects Intel, AMD and Apple components, aluminium housing and Austin final assembly for the Americas.
- Galaxy S9 records distinct chipset configurations, Samsung camera sensors and historical Noida assembly without allocating a chipset to a factory batch.

All three map points are approximate town/city placements. No chip fab is located from a company address. One known supplier does not prove sole sourcing. Production volumes, probabilities, market shares and numeric risk scores are deliberately absent. Source dates span historical products and later documentation observations; this is not a live sourcing feed. The illustrated teardown geometry is approximate and is not a repair guide or CAD model. See [SOURCES.md](SOURCES.md) and [VISUALS.md](VISUALS.md).

## Verification record

Local release verification on 2026-09-10 UTC:

- 41 backend tests passed, including factory/product isolation, variant/date scope, inference anchors, disputed status, material paths, auth, transactional imports, alias resolution, caching, review persistence and safe upgrades.
- 22 browser tests passed across desktop and mobile, including all nine product studios, the defining evidence flow, URL navigation, keyboard controls, axe accessibility, map selection, supplier comparison, administrative review and lock races.
- TypeScript, lint and production build passed. npm and pinned Python dependency audits reported no known vulnerabilities at verification time.
- Docker image built and ran as UID 10001 with a read-only root filesystem; production HTTP smoke checks passed against its SQLite-backed API and compiled assets.
- Both allowlisted documentation sources were fetched live into an isolated verification database and queued for human review.
- Manual browser inspection covered component separation and the Austin factory profile/map. Screenshots are in `docs/screenshots`.

Separate agents performed bounded independent code reviews in addition to implementation self-review. Findings about status filtering, graph edge provenance, null-part propagation, material links, uncategorized parts, pending admin responses and curated upgrade conflicts were addressed with targeted regressions. This is not an external security audit or penetration test.

CI runs backend, browser/build and Docker smoke/persistence jobs on pull requests and main. Exact PR/check/merge status is maintained in the authoritative GitHub backlog rather than asserted in advance in this source document.

## Delivery record and remaining work

- [M1 / issue #1](https://github.com/jsantoru/supply-atlas/issues/1): evidence foundation, delivered in [PR #4](https://github.com/jsantoru/supply-atlas/pull/4).
- [M2 / issue #2](https://github.com/jsantoru/supply-atlas/issues/2): exploration workspace began in [PR #5](https://github.com/jsantoru/supply-atlas/pull/5); release verification includes supplier comparison and semantic fixes.
- [M3 / issue #3](https://github.com/jsantoru/supply-atlas/issues/3): reviewed ingestion, protected administration, Docker and release operations.
- [M4 / issue #6](https://github.com/jsantoru/supply-atlas/issues/6): product studio and researched factory enrichment.
- [Public deployment / issue #7](https://github.com/jsantoru/supply-atlas/issues/7): external host/domain/TLS prerequisite.

Future enhancements, not deferred initial requirements: wider industry coverage, more precisely licensed factory imagery/coordinates, manufacturer CAD geometry where available, additional source adapters, and multi-user identity with a larger database backend if deployment scale requires it.

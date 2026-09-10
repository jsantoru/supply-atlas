# Supply Atlas release status

This is a locally deployable Docker research demo with a production build and persistent SQLite storage. Public production deployment is not claimed: a Docker host, domain, TLS and host-level operational verification are still required in [issue #7](https://github.com/jsantoru/supply-atlas/issues/7). No paid infrastructure has been purchased. Backup/restore was explicitly removed from scope by the user.

## Delivered capability

The defining flow is product → documented part → supplier or manufacturing facility → individually scoped evidence → another product sharing that exact part. Product studio includes eleven generated photorealistic illustrations. Nine electronics products use component selection and layer separation; Mohajer-6 and Shahed-238 use conceptual major-system cards and cited historical dossiers. The graph, component hierarchy, clustered map, profiles, global search, shareable URL filters, product/supplier comparison and hypothetical disruption views use the same scoped manufacturing-claim model.

Aircraft dossiers contain 20 additional sources, nine major-system topics and 45 dated entries spanning chronology, organizations, public leadership, manufacturing context and evidence limits. Dossier narratives cover all cited dates; workspace filters apply only to the separately labeled manufacturing attributions. Generated exteriors are not CAD models or engineering teardowns. No detailed weapons parts lists, operational guidance or military-site coordinates are included. See [DRONE-RESEARCH.md](DRONE-RESEARCH.md).

The source review desk checks two licensed documentation paths, caches conditional fetches and hashes, retains attributed snapshots, and requires a human decision. Protected corrections and bundle imports validate entity resolution and reference integrity, preserve revisions, and survive restart. Built-in collection updates preserve operator corrections and report conflicts. No automated claim extraction or unreviewed promotion is implied.

## Collection

82 entities: 11 products, 24 parts/configurations, 16 companies, 3 facilities, 2 materials, plus categories, industries, regions and variants. The collection contains 36 scoped claims and 37 sources, including the 20 aircraft research references. Narrative system categories and leadership records are not counted as physical components or suppliers.

- Raspberry Pi 5, Pi 4, Pi 500, Pi 400, Pico, Pico W and Pico 2 connect through Broadcom, Raspberry Pi, Infineon, TSMC, Renesas, VIA Labs, Winbond and Abracon observations.
- Mac Pro 2019 connects Intel, AMD and Apple components, aluminium housing and Austin final assembly for the Americas.
- Galaxy S9 records distinct chipset configurations, Samsung camera sensors and historical Noida assembly without allocating a chipset to a factory batch.
- Mohajer-6 records QAI design/manufacture attributions and separately discusses the dated Tehran production-line event; it does not assign a current factory location.
- Shahed-238 records a conservatively inferred organizational development attribution. Display venues, earlier Shahed-family statements and Russian derivative findings do not create a final-assembly claim.

All three map points are approximate town/city placements. No chip fab is located from a company address. One known supplier does not prove sole sourcing. Production volumes, probabilities, market shares and numeric risk scores are deliberately absent. Source dates span historical products and later documentation observations; this is not a live sourcing feed. The illustrated teardown geometry is approximate and is not a repair guide or CAD model. See [SOURCES.md](SOURCES.md) and [VISUALS.md](VISUALS.md).

## Verification record

Local release verification on 2026-09-10 UTC:

- 46 backend tests passed, including factory/product isolation, variant/date scope, inference anchors, disputed status, material paths, auth, transactional imports, alias resolution, caching, review persistence, safe upgrades, narrative citation integrity and contextual-record isolation.
- 30 browser tests passed across desktop and mobile, including all eleven product studios, the defining evidence flow, URL navigation, keyboard controls, axe accessibility, map selection, supplier comparison, administrative review, research citations, error recovery and filter boundaries.
- TypeScript, lint and production build passed. Dependency manifests and locks are unchanged in the aircraft expansion; the initial release's npm and pinned Python dependency audits reported no known vulnerabilities at their verification time.
- Docker image built and ran as UID 10001 with a read-only root filesystem; production HTTP smoke checks passed against its SQLite-backed API and compiled assets.
- Initial-release verification fetched both allowlisted documentation sources live into an isolated database and queued them for human review. The aircraft sources remain manual-only.
- Visual inspection includes desktop/mobile aircraft studios as well as the original component separation and Austin factory profile/map. Screenshots are in `docs/screenshots`.

Separate agents performed bounded independent code reviews in addition to implementation self-review. Findings about status filtering, graph edge provenance, null-part propagation, material links, uncategorized parts, pending admin responses and curated upgrade conflicts were addressed with targeted regressions. This is not an external security audit or penetration test.

Aircraft research reviews additionally checked model-specific citations and publication dates. Browser review found and corrected mobile view-control overlap, card-spacing collisions and the desktop sidebar's missing accessibility landmark.

CI runs backend, browser/build and Docker smoke/persistence jobs on pull requests and main. Exact PR/check/merge status is maintained in the authoritative GitHub backlog rather than asserted in advance in this source document.

## Delivery record and remaining work

- [M1 / issue #1](https://github.com/jsantoru/supply-atlas/issues/1): evidence foundation, delivered in [PR #4](https://github.com/jsantoru/supply-atlas/pull/4).
- [M2 / issue #2](https://github.com/jsantoru/supply-atlas/issues/2): exploration workspace began in [PR #5](https://github.com/jsantoru/supply-atlas/pull/5); release verification includes supplier comparison and semantic fixes.
- [M3 / issue #3](https://github.com/jsantoru/supply-atlas/issues/3): reviewed ingestion, protected administration, Docker and release operations.
- [M4 / issue #6](https://github.com/jsantoru/supply-atlas/issues/6): product studio and researched factory enrichment.
- [Aircraft research / issue #9](https://github.com/jsantoru/supply-atlas/issues/9): Mohajer-6 and Shahed-238 public-interest dossiers and visual studios.
- [Public deployment / issue #7](https://github.com/jsantoru/supply-atlas/issues/7): external host/domain/TLS prerequisite.

Future enhancements, not deferred initial requirements: wider industry coverage, more precisely licensed factory imagery/coordinates, manufacturer CAD geometry where available, additional source adapters, and multi-user identity with a larger database backend if deployment scale requires it.

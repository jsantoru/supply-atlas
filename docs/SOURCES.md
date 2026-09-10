# Source inventory and reuse

The authoritative machine-readable inventory is `backend/research/collection.json`: every source has publisher, URL, publication date if available, retrieval date, terms URL and reuse restrictions. Individual claims cite precise sections; no restricted article excerpts or images are bundled.

Research accessed September 10, 2026. The collection contains **12 products, 24 specific parts/configurations, 17 companies, 3 facilities, 2 materials, 38 claims and 51 sources**. It covers seven Raspberry Pi computer/microcontroller products, Apple Mac Pro (2019), Samsung Galaxy S9, Mohajer-6, Shahed-238 and LUCAS. Three TSMC part-level process dependencies connect the Raspberry Pi products. These are historical observations, not a live sourcing feed or complete BOM. Unknown memory vendors, chip fabs, packaging sites, material suppliers and alternate sourcing are explicit coverage gaps.

The three aircraft add 34 manual sources, 14 conceptual system topics, 80 dated narrative records and six LUCAS program-network records. Narrative records live in `backend/research/drone_dossiers.json`; they are not component or factory claims. Their only supply-graph additions are two explicit QAI organizational attributions for Mohajer-6 and one conservatively inferred Shahed-238 development attribution, plus two explicit SpektreWorks developer/manufacturer attributions for LUCAS. The six LUCAS industrial/program/evaluation relationships are separately classified and do not become supply dependencies. Each dossier contains its full linked reference list, publication/retrieval dates and access limitations. See [DRONE-RESEARCH.md](DRONE-RESEARCH.md).

Raspberry Pi website pages are publicly viewable, **not open-licensed data**. [Website terms](https://www.raspberrypi.com/terms-and-conditions/) reserve rights and restrict scraping/text mining. They are manual factual references only; no automated fetch adapter, page cache, photographs or copied prose is distributed. Do not use documentation licensing as permission to scrape articles.

The [documentation repository](https://github.com/raspberrypi/documentation) and [licensing page](https://www.raspberrypi.com/licensing/) identify CC BY-SA 4.0 documentation. BCM2711 and keyboard-computer facts are adapted into normalized records, attributed to Raspberry Pi Ltd, with original URLs. Those adapted data records remain CC BY-SA 4.0. Automated checks are restricted to the exact allowlisted raw documentation paths, retain hashes and conditional request metadata, and flag changes for human review. They never silently promote changed source text into claims.

RP1/TSMC evidence does not identify a fab or manufacturing country. RP1 sourcing applied to Pi 500 is a **part-level extrapolation**, displayed as such in scenarios. Pencoed is board assembly for Pi 5 in the cited 2023 source; its location is approximate at town level. No Pi 400/500 facility is assigned from that record. One known supplier never establishes sole sourcing.

## Reviewed expansion

| Product | Documented parts and relationship | Factory scope and important limits |
| --- | --- | --- |
| Apple Mac Pro (2019) | Intel Xeon W eight-core/3.5 GHz configuration; AMD Radeon Pro 580X option; Apple T2; optional Apple Afterburner; aluminium housing | Apple explicitly identifies Austin final assembly for units shipping to the Americas in November 2019. The contract operator is unnamed in the source and stays unknown in the database. The housing material is documented, but its material supplier, smelter and factory are unknown. |
| Samsung Galaxy S9 | Samsung Exynos 9810 and Qualcomm Snapdragon 845 are separate configuration claims; Samsung ISOCELL 2L3 and 3H1 sensors carry country/carrier qualifications | Samsung explicitly names Galaxy S9 in its July 2018 Noida manufacturing announcement for the Indian market. No chipset configuration is assigned to a Noida batch, and no chip fabrication there is implied. |
| Raspberry Pi Pico W | RP2040 and Infineon CYW43439 | Shares the exact RP2040 dependency with Pico. Generic RP2040/TSMC process evidence is an inferred product allocation, with no fab or board assembly location. |
| Raspberry Pi Pico 2 | RP2350, Winbond W25Q32RV flash and Abracon ABM8-272-T3 crystal | The named external devices are from the July 2026 datasheet revision. TSMC 40 nm is documented at chip level. Factory, country, alternate devices and board batch allocations remain unknown. |

Austin and Noida coordinates are **city-level illustrative map placements**, not researched street addresses, surveyed plant centroids or evidence of a facility footprint. Their source-backed city and region names are recorded in each facility's `location_reference`. The existing Pencoed point remains town-level approximate. No factory locations are generated from corporate headquarters.

The aluminium record establishes only a material-to-housing relationship. The `supplier_id` is deliberately empty. Silicon remains a taxonomy entity without a sourced material-supply claim; the collection does not invent a mine, wafer supplier, alloy or refinery to make the graph fuller.

## Additional source inventory

| Source | Publication / revision date | Precise evidence scope |
| --- | --- | --- |
| [Apple Mac Pro technical specifications](https://support.apple.com/en-us/118461) | Not supplied; retrieved 2026-09-10 | Processor / 8-Core; Graphics / Radeon Pro 580X; Storage / Apple T2. CPU order code is not inferred. |
| [Apple Mac Pro launch](https://www.apple.com/newsroom/2019/06/apple-unveils-powerful-all-new-mac-pro-and-groundbreaking-pro-display-xdr/) | 2019-06-03 | Afterburner option and aluminium removable enclosure. |
| [Apple expands in Austin](https://www.apple.com/newsroom/2019/11/apple-expands-in-austin/) | 2019-11-20 | Mac Pro production and Americas shipment paragraphs; final assembly site distinct from Apple's office campus. |
| [Samsung Noida plant announcement](https://news.samsung.com/in/samsung-inaugurates-worlds-largest-mobile-factory-in-india) | 2018-07-09 | Paragraph explicitly naming Galaxy S9, S9+ and Note8 at Noida. Only S9 is included in this collection. |
| [Samsung Galaxy S9 component disclosure](https://semiconductor.samsung.com/news-events/tech-blog/invisible-details-make-the-galaxy-s9-more-powerful/) | Not supplied; retrieved 2026-09-10 | Exynos paragraph and labelled sensor identities, retaining country/carrier qualification. The diagram itself is not copied. |
| [Qualcomm Galaxy S9 announcement](https://www.qualcomm.com/news/releases/2018/02/qualcomm-snapdragon-845-mobile-platform-powers-advanced-connectivity-and) | 2018-02-24 as displayed by Qualcomm | Snapdragon 845 in select regions; the source does not enumerate a complete region list. |
| [Raspberry Pi Pico W launch](https://www.raspberrypi.com/news/raspberry-pi-pico-w-your-6-iot-platform/) | 2022-06-30 | RP2040 and Infineon CYW43439. |
| [Raspberry Pi Pico 2 launch](https://www.raspberrypi.com/news/raspberry-pi-pico-2-our-new-5-microcontroller-board-on-sale-now/) | 2024-08-08 | RP2350 designed by Raspberry Pi. |
| [RP2350 process discussion](https://www.raspberrypi.com/news/rp2350-the-brains-of-raspberry-pi-pico-2/) | 2024-09-11 | TSMC 40 nm process; no particular fab. |
| [Pico 2 datasheet](https://datasheets.raspberrypi.com/pico/pico-2-datasheet.pdf) | Revision 2026-07-03 | Page 4 external circuitry: Winbond flash and Abracon crystal; revision history on page 22. |

Apple, Samsung and Qualcomm pages are **public factual references, not open-licensed source content**. The reviewed [Apple site terms](https://www.apple.com/legal/internet-services/terms/site.html), [Samsung India newsroom terms](https://news.samsung.com/in/terms), [Samsung Semiconductor terms](https://semiconductor.samsung.com/legal/) and [Qualcomm terms](https://www.qualcomm.com/site/terms-of-use) do not grant a general open licence to their content. This repository contains independently phrased factual identifications and precise references, without their prose, photographs, diagrams, tables, logos or page caches. These manual sources have no automatic fetching adapter. Incorporating their actual source content would require permission appropriate to the intended use; public visibility alone is not permission.

The Pico 2 PDF colophon restricts resource use, while section 1.1 separately grants broad reuse of the **hardware design files**. This does not make the entire PDF open-licensed. The collection records only manually checked component identities and page references, without redistributing PDF content. The existing CC BY-SA documentation sources remain the only sources used by the automated documentation adapter.

## Reproduction and review

Run `python -m backend.research.build_collection` to deterministically regenerate `collection.json` and `drone_dossiers.json` from the reviewed factual records. The direct script invocation also remains supported. This command makes no network requests. Startup imports new curated entity/source/claim records and updates unchanged curated records; administrator corrections are preserved and seed conflicts are logged for review. The protected review workflow can import a separately reviewed bundle with its reason and evidence. Dossier narratives are versioned release content, not editable records in the current administration screen.

The enrichment tests verify independent product/factory scope, both known assembly regions, unassigned chip fabs, configuration qualifications, material provenance and the exact-part connections used for shared dependency pivots. Date filters follow documented observation dates; an undated source retrieved in 2026 does not prove the claim was already known to this collection in 2018.

Sources investigated but not imported: broad corporate supplier lists (insufficient product/factory scope), magazine pages (noncommercial reuse restrictions), prospectus references (require more granular product/time review), and teardown content without verified reuse permission. Newer Samsung models are not assigned to Noida from this older S9 disclosure. Mac Pro generations other than 2019 are not assigned to Austin from this record.

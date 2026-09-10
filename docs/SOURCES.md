# Source inventory and reuse

The authoritative machine-readable inventory is `backend/research/collection.json`: every source has publisher, URL, publication date if available, retrieval date, terms URL and reuse restrictions. Individual claims cite precise sections; no restricted article excerpts or images are bundled.

Research accessed September 10, 2026 UTC (September 9 in New York). The collection covers five Raspberry Pi computer/microcontroller products, named semiconductor parts, one documented board-assembly facility, and two TSMC part-level process dependencies. These are historical observations, not a live sourcing feed or complete BOM. Unknown memory vendors, chip fabs, packaging sites, material suppliers and alternate sourcing are explicit coverage gaps.

Raspberry Pi website pages are publicly viewable, **not open-licensed data**. [Website terms](https://www.raspberrypi.com/terms-and-conditions/) reserve rights and restrict scraping/text mining. They are manual factual references only; no automated fetch adapter, page cache, photographs or copied prose is distributed. Do not use documentation licensing as permission to scrape articles.

The [documentation repository](https://github.com/raspberrypi/documentation) and [licensing page](https://www.raspberrypi.com/licensing/) identify CC BY-SA 4.0 documentation. BCM2711 and keyboard-computer facts are adapted into normalized records, attributed to Raspberry Pi Ltd, with original URLs. Those adapted data records remain CC BY-SA 4.0. Automated checks are restricted to the exact allowlisted raw documentation paths, retain hashes and conditional request metadata, and flag changes for human review. They never silently promote changed source text into claims.

RP1/TSMC evidence does not identify a fab or manufacturing country. RP1 sourcing applied to Pi 500 is a **part-level extrapolation**, displayed as such in scenarios. Pencoed is board assembly for Pi 5 in the cited 2023 source; its location is approximate at town level. No Pi 400/500 facility is assigned from that record. One known supplier never establishes sole sourcing.

Sources investigated but not imported: broad corporate supplier lists (insufficient product/factory scope), magazine pages (noncommercial reuse restrictions), prospectus references (require more granular product/time review), and teardown content without verified reuse permission. Material data remains empty rather than being fabricated.

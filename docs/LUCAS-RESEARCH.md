# LUCAS research and visual studio

The LUCAS entry brings together **18 cited sources, 36 dated narrative records, five major-system topics, two industrial attributions and 15 separately classified network relationships across 12 nodes**. The interactive dossier is the research artifact; each entry carries its own date, evidence basis and linked reference. Its scope covers the public record reviewed on September 10, 2026.

Open `/?product=lucas&view=teardown` for the studio and full dossier, or `/?product=lucas&view=network` for the manufacturing and program views.

## Evidence and identity

Original government publications, official hearing records, company descriptions and original reporting support different kinds of statements. The source inventory retains publication dates, event dates, access notes and precise references. Explicit published developer/manufacturer attributions are marked direct in the manufacturing graph, with caveats explaining that this means an explicit attribution, not an independent factory audit.

The dossier preserves these boundaries:

- LUCAS and the separately marketed FLM 136 target platform do not share an assumed parts list, configuration or performance table.
- Historical lineage is distinct from a present supplier relationship; Shahed-136 references do not establish a Shahed-238 connection.
- Evaluated aircraft, displayed prototypes and fielded aircraft retain their separate dates and source scopes.
- High-level weapons and payload context does not disclose internal assembly, activation, targeting, explosive design or integration details.
- Dated public leadership roles are distinct from engineering authorship. The reviewed original sources do not establish a verified SpektreWorks executive roster, ownership percentages or individual LUCAS engineering responsibilities.
- A company location, test center, naval demonstration and program organization do not establish a product-specific factory. No new military-site coordinates or factory markers are introduced.

Source-specific corrections are retained in the source notes. These include a hearing PDF whose filename disagrees with its title-page date, a given-name transcription variant resolved against the official witness listing, and distinct event/publication dates. No current officeholding is inferred from a historical role.

## Two kinds of network

The existing supply graph contains the two product-scoped SpektreWorks development/manufacture attributions. There are no invented lower-tier suppliers or component dependencies.

The default **Documented network** view contains 12 named nodes and 15 individually cited relationships. It connects Research & Engineering through APFIT to LUCAS; CENTCOM through SOCCENT and Scorpion Strike; and NAVCENT/Fifth Fleet through Task Force 59. REJTF's capability alignment, Marine Corps sponsorship, Yuma evaluation and SpektreWorks' two industrial roles retain their distinct meanings. This provides institutional depth without inventing lower-tier vendors.

The June 17, 2025 APFIT release lists **$30 million for the Marine Corps LUCAS project**. It does not identify the company recipient or establish a $30 million SpektreWorks contract. The original September 2025 REJTF and September 2021 Task Force 59 announcements establish organizational history; their later LUCAS connections use separate aircraft-specific sources. The undated SOCCENT directory carries a review date, not an invented founding date.

Industrial attribution, evaluation and program context have distinct visual treatments. Node and relationship-type filters support exploration; selecting a relationship shows its date, explanation and original source. Connections spanning several organizations are contextual paths, not inferred procurement chains. These edges never feed disruption calculations, factory counts, supplier concentration or cross-product dependency inference. The **Supplier claims** tab retains the manufacturing graph and workspace filters; the documented network covers all its cited dates.

Both network requests have independent loading and retry handling. A failed manufacturing graph does not hide an otherwise available program record. On narrow screens, the graph scrolls horizontally; keyboard focus brings each node into view, and all relationships remain available in the list below.

## Visual interaction

The exterior illustration is an original AI-generated asset, informed by official exterior photographs. It is labeled as an illustration. The separate SVG diagram uses conceptual exterior shapes, not measured CAD or internal mechanical geometry.

“Explode exterior” switches to the diagram and separates the visible wing sections, shell and propeller. The slider controls separation continuously; “Assemble exterior” restores the conceptual outline. Numbered points, the topic strip and inspector selections stay synchronized with the cited dossier. Rotation, tilt and reset affect the view; reset also restores the first topic. Guidance, payload role and ground support use dashed topic callouts outside the silhouette, without invented internal locations.

If the image fails, the diagram and citations remain usable. The controls work with a keyboard and respect reduced-motion preferences. Asset provenance and the exact generation prompt are recorded in [VISUALS.md](VISUALS.md).

## Reproduction and validation

`backend/research/lucas_research.py` is the reviewed source file. `python -m backend.research.build_collection` regenerates the collection and dossier JSON without network access. Validation rejects missing nodes, duplicates, self-links, isolated nodes and disconnected cited groups. Every node must connect to the single focal product, whose ID must match the dossier. Existing SQLite operator corrections retain the established upgrade safeguards.

Browser coverage checks actual exterior geometry movement, assembly/reset, keyboard control, source-selection coupling, image failure, both network error paths, independent filters, responsive layouts and accessibility. The full twelve-product acceptance suite remains in place. See [RELEASE.md](RELEASE.md) for completed verification, [issue #12](https://github.com/jsantoru/supply-atlas/issues/12) for the original studio and [issue #14](https://github.com/jsantoru/supply-atlas/issues/14) for the expanded network.

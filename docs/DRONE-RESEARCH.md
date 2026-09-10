# Aircraft research dossiers

Supply Atlas includes public-interest research dossiers for **Mohajer-6**, **Shahed-238** and **LUCAS**, reviewed on September 10, 2026. The interactive dossiers are the primary research artifact: each contains an exterior illustration, selectable system topics, chronology, organizations, public leadership, manufacturing context, unresolved questions and a complete linked source list.

| Dossier | System topics | Dated narrative records | Sources | Manufacturing claims |
| --- | ---: | ---: | ---: | ---: |
| Mohajer-6 | 5 | 24 | 10 | 2 explicit QAI organization attributions |
| Shahed-238 | 4 | 21 | 10 | 1 conservatively inferred development attribution |
| LUCAS | 5 | 36 plus 15 network records | 18 | 2 explicit SpektreWorks attributions |

LUCAS includes a separate interactive exterior diagram and a cited program/evaluation network. See [LUCAS-RESEARCH.md](LUCAS-RESEARCH.md) for its identity boundaries, controls and verification.

Open the Product studio or Major systems tab after selecting an aircraft. System topics are descriptive categories, not a count of physical components. Mohajer-6 and Shahed-238 separate topic cards; LUCAS separates conceptual exterior shapes in an interactive diagram. Neither reveals an internal assembly. Generated images provide no sourcing evidence. Their prompts and saved asset paths are recorded in [VISUALS.md](VISUALS.md).

## Evidence and scope

The reviewed sources combine original visual analysis, contemporary event reporting, dated government statements, research assessments and a civilian-impact investigation. Each statement identifies its source and observation/publication context. An issuing government's attribution is not presented as an independent factory inspection, and an exhibition's announced options are not treated as a verified production configuration.

The Mohajer-6 record retains a disagreement over the early unveiling year and anchors its production chronology on the documented February 2018 event. The DIA report's observation cutoff is October 27, 2022. Its February 14, 2023 release day is independently established by the [original DIA release notice](https://www.dia.mil/News-Features/Articles/Article-View/Article/3297418/dia-report-confirms-russias-use-of-lethal-iranian-unmanned-aerial-vehicles-in-u/), rather than inferred from a later briefing.

Shahed-238 research distinguishes an unnamed September 2023 precursor, the named November display, early unconfirmed identification reports and later observations. Geran-3 is discussed as a separately scoped Russian derivative; it is not registered as an unconditional alias for the Iranian product. Shahed-131/136 and Geran-2 findings do not populate the Shahed-238 graph.

Names are included only in documented, dated public organizational roles. Company directors, commanders and exhibition attendees are not inferred to be individual product engineers. The Mohajer-6 board-members entry groups four directors to reflect the source's shared role statement; the UI therefore counts leadership records, not distinct people.

The Tehran production-line inauguration and Tehran exhibition are contextual records, not current geolocated military factories. No precise site coordinates, production volumes, operational deployment maps, engineering drawings, internal assemblies, detailed weapons BOMs, sourcing routes or procurement instructions are included. Factory and batch allocations remain unresolved where the sources do not establish them.

## Reproducibility and corrections

`backend/research/drone_research.py` and `backend/research/lucas_research.py` contain the reviewed source metadata, entity/claim additions and narratives. Run `python -m backend.research.build_collection` to reproduce both JSON artifacts without network access. The FastAPI dossier model validates the structured narrative format. Tests ensure references resolve, IDs remain distinct, sources stay manual-only and contextual records cannot create product-part, facility or cross-product dependencies.

The full source inventory is available within each dossier and in `backend/research/collection.json`. Each source includes its original URL, publisher, publication date when established, retrieval date and access/reuse notes. Search-index-only access is disclosed for the AP briefing and Army ODIN entry; undated Janes material remains undated. Source text, photos, diagrams and technical tables are not bundled.

Dossier prose is versioned release content, separate from the admin-editable manufacturing claims. Workspace evidence/date/role filters constrain only the latter. The app labels that boundary and displays missing source metadata rather than inventing citations. Existing operator corrections to SQLite records are preserved by the curated upgrade mechanism.

## Review and acceptance

The change is tracked in [issue #9](https://github.com/jsantoru/supply-atlas/issues/9). Bounded independent research and implementation reviews checked source attribution, product identity, dates, layout, citations and graph isolation. Browser coverage includes both studios, keyboard controls, source notes, failed-request retry, missing illustrations, organization-profile links and filtered attributions. The existing electronics-product acceptance suite remains part of release validation. See [RELEASE.md](RELEASE.md) for the final verification record.

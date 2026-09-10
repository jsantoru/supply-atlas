# Ingestion and research administration

Public exploration does not require authentication. Administrative requests require `Authorization: Bearer <ADMIN_TOKEN>`; configure a random token of at least 32 characters on the server. The review desk keeps the token in memory only. This release is a single-operator system: audit reasons identify the work performed, not individual user accounts. Use HTTPS for any deployment beyond localhost.

## Licensed documentation checks

Choose **Administration → Check licensed documentation**. `POST /api/admin/refresh` checks exactly these two Raspberry Pi documentation paths:

- `documentation/asciidoc/computers/processors/bcm2711.adoc`
- `documentation/asciidoc/computers/keyboard-computers/intro.adoc`

The adapter fetches them from the `raspberrypi/documentation` repository on `raw.githubusercontent.com`. It requires the matching source ID, canonical GitHub URL, adapter name and CC BY-SA 4.0 license. Changing an editable source URL cannot redirect the adapter. Redirects and HTML responses are rejected. Requests have connection/read timeouts, a 25-second streaming elapsed-time ceiling, a 2 MB decoded document limit and a one-minute repeat-check interval per source. ETag and Last-Modified headers support conditional requests; SHA-256 hashes deduplicate returned content.

The first successful fetch and every new document version create a **pending** snapshot. The database retains the exact UTF-8 text, content hash, retrieval time, fetch URL, and source attribution and reuse terms as they stood at retrieval. Unchanged documents keep their previous review decision. Failures appear in ingestion status and do not change published claims. Cached licensed source text remains available to authenticated reviewers; article text from restricted websites is never fetched or stored by this adapter.

In the review desk, open a snapshot and inspect its text and affected claim IDs alongside the original source. **Acknowledge** records that the document was reviewed; **Reject** records why it should not be used. Neither decision asserts that the source confirms a claim or changes a claim automatically. Update affected claims separately with the record editor or a reviewed bundle, retaining uncertainty, dates and precise references. If a source contradicts a claim, preserve both claims with distinct IDs and use `disputed`, `outdated` and `supersedes` when the evidence warrants them.

Snapshot review uses `POST /api/admin/snapshots/{id}/review` with `{ "digest": "<64-character hash>", "decision": "acknowledged", "reason": "Explain the document review and any follow-up" }`. A mismatched digest or a second decision is rejected with HTTP 409. Snapshots and their decisions survive restarts. Source checks perform document ingestion; substantive supply-chain extraction and approval remain human-reviewed because a part mention alone does not establish a supplier, product, facility or production period.

## Reviewed imports and corrections

Use **Import reviewed collection** for normalized, evidence-backed records. Provide a review reason of at least 10 characters and a JSON object containing `entities`, `sources` and `claims` arrays. Empty arrays are allowed for partial imports. The API wrapper is:

```json
{
  "reason": "Explain the evidence review and intended corrections",
  "bundle": { "entities": [], "sources": [], "claims": [] }
}
```

`POST /api/admin/import` validates the entire resulting collection and commits all changes in one transaction. Invalid references, wrong entity types, duplicate IDs/claims/source URLs, conflicting normalized names or aliases, incompatible parents, hierarchy cycles, invalid variant ownership and supersession cycles reject the entire import. Use an existing stable entity ID when a name or alias resolves to that entity. Unicode compatibility normalization, case folding and whitespace normalization prevent superficial label differences from creating duplicates. Exact repeated reviewed bundles are cached and do not reapply later administrator edits.

`PUT /api/admin/{entity|source|claim}/{id}` accepts `{ "record": {}, "reason": "..." }`. Existing entity IDs and types remain stable. A reviewed import may intentionally update existing IDs; inspect changes before submission. Each changed record retains its before and after payload and review reason in the revision history. `GET /api/admin/revisions/{id}` exposes the full audit record to the administrator. Bundle imports never delete omitted records.

A claim scoped only to a supplier and customer represents a general commercial relationship. It remains visible on entity profiles but does not establish a product dependency. Product, part, facility, material, geography, variant and time scope must come from evidence; no supplier-to-factory transitive join is used to fill missing scope.

## Built-in collection updates

Startup applies SQL migrations, then synchronizes the reviewed built-in collection. Each record tracks the hash of its last curated release value. New records are added; existing records update only when they still match their previous curated baseline or already match the new release. Administrator-modified records are preserved, and their IDs appear in the `curated-release` ingestion run as `preserved_admin_records`. Resolve those conflicts deliberately through the editor or a reviewed import. Omitted records remain as historical evidence. Repeated startup with the same collection hash does not reset edits or reimport the release.

When upgrading a database created before baseline tracking, the original research-import audit entry establishes a baseline only where one exists. Unrecognized preexisting records are preserved rather than overwritten. Entity/source/claim validation runs before committing release data. If an incoming release conflicts structurally with a valid existing collection, the update rolls back, records an actionable failed ingestion run, and the application continues serving the existing collection. Resolve the conflict through reviewed administration and restart to retry. Invalid fresh seed data and storage failures stop startup rather than presenting an empty or invalid collection as healthy.

See [SOURCES.md](SOURCES.md) for source inventory, factual scope and licensing. No automated adapter is provided for manufacturer articles, product pages, restricted teardowns or other websites whose reuse and access terms do not authorize this ingestion.

## Released research dossiers

`GET /api/research/{product}` serves validated, versioned narrative research for the two aircraft. `GET /api/atlas` includes a small `research` index with system-topic and entry counts. The narrative sections are compiled from `backend/research/drone_research.py` into `drone_dossiers.json`. They resolve source records from SQLite, report missing source IDs explicitly, and return 404 for products without a dossier.

Dossier narratives are release content; changing them requires a reviewed source change and restart. The current admin editor continues to manage entities, sources and manufacturing claims. Source metadata corrections are reflected when a dossier is requested. Contextual organizations, people, exhibition venues and major-system categories never become graph edges, factory markers or component counts. Dossiers cover all their cited dates, while workspace filters continue to constrain manufacturing claims; both scopes are labeled in the UI.

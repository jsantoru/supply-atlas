# Deployment and architecture

FastAPI provides server-side Pydantic validation and explicit REST endpoints. SQLite keeps installation and operation compact for one research collection and one operator. React and TypeScript provide interactive graph, map, comparison and teardown views. Vite compiles static assets, which FastAPI serves from the same origin. No Node process is needed at runtime.

The Dockerfile uses a Node build stage and Python runtime stage. The process runs as UID/GID 10001 with no Linux capabilities, no privilege escalation, a read-only image filesystem and a bounded temporary filesystem. The named `/data` volume is writable and survives normal restarts/recreation. Frozen Python dependencies and `npm ci` make application dependencies reproducible; base image tags should be refreshed deliberately with the tests below. The runtime includes pytest for container diagnostics.

Compose binds only to host loopback. Production image health checks exercise SQLite. Request logs include method, path, status and duration, not bearer tokens or request bodies. Docker rotates logs at 10 MB with three files. The application limits administrative request bodies, validates references transactionally, retains correction history and rate-limits failed administrative authentication.

## Public host requirements

1. Supply a Linux Docker host with persistent local storage, at least 2 GB RAM for image builds, and an operator responsible for updates and monitoring. No host has been purchased or provisioned by this project.
2. Deploy the reviewed commit with `docker compose up --build -d --wait`. Confirm health and run `python scripts/smoke.py` against it.
3. Place a TLS reverse proxy on the host in front of `127.0.0.1:5174`; configure the chosen domain and certificate. Preserve `Authorization` headers and keep `/api/admin` private to operators where possible. The API does not trust forwarded headers by default. Through one proxy, failed-login rate limiting is shared across clients; this conservative behavior is deliberate.
4. Set a unique `ADMIN_TOKEN` through the host's protected environment or secret manager. Do not bake it into the image or frontend. Never publish `.env` or the database.
5. Verify browser access over HTTPS, map attribution, protected administration and logs on the real domain. Public TLS and domain verification remain deployment requirements.

Use one application replica and local SQLite storage. WAL plus a busy timeout accommodates concurrent readers and short writes; this is not a multi-writer distributed database or network-filesystem deployment. A larger hosted collection should migrate to PostgreSQL and per-user authentication through a separately reviewed change.

## Schema and release updates

Numbered SQL files in `backend/migrations` run transactionally at startup and are recorded in `schema_migrations`. Never edit an applied migration. Add a new migration and cover upgrades with tests. Research data updates go through the ingestion/review workflow; restarting must preserve reviewed operator changes.

Rebuild from a reviewed commit, run backend and browser tests, then container smoke tests. CI recreates the container and verifies an operational ingestion record persists in the named volume. After deployment, confirm `/api/health`, source counts and the defining product→part→facility→evidence workflow. Rollback to an older application image is only valid if that image supports the current schema; no automatic downgrade migration is supplied.

Backup and restoration tooling is intentionally outside the agreed scope. No backup service is configured or implied.

## External services

Map tiles use OpenStreetMap's standard endpoint and visible attribution. No bulk/offline tile download is provided. Automated tests intercept tile requests; traffic must respect the [tile usage policy](https://operations.osmfoundation.org/policies/tiles/). For substantial public traffic, configure a suitable tile provider before launch. Only allowlisted, licensed Raspberry Pi GitHub documentation is refreshed automatically; article pages remain manual factual references.

The earlier Sites project is unused: its worker runtime does not run this requested Python/SQLite Docker application. The supported deployment artifact is the Docker image and Compose file.

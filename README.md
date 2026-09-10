# Supply Atlas

A research workspace for exploring products, documented components, suppliers and manufacturing locations. The product studio, graph, map and evidence drawer share one scoped dataset; a shared company never transfers a factory assignment to another product.

## Start with Docker

Install Docker with Compose v2 and start the Docker engine. From this repository:

```sh
docker compose up --build -d --wait
```

Open **http://127.0.0.1:5174**. One container serves the compiled React frontend and Python API. SQLite lives in the persistent `supply-atlas_atlas_data` named volume; it is not a separate database server. Migrations and the reviewed starter collection initialize automatically. `docker compose stop` stops the app; `docker compose start --wait` starts it again. `docker compose logs -f app` shows operational logs.

If the port is occupied, put `PORT=5184` in `.env`, then use that port in the browser. The included `.env.example` documents available configuration. Never run `docker compose down --volumes` unless you intend to delete the database.

## Enable research administration

Public exploration works without credentials. Administration is disabled unless `ADMIN_TOKEN` contains at least 32 characters. Copy `.env.example` to `.env`, generate a secret, and paste it into `ADMIN_TOKEN`:

```sh
python -c "import secrets; print(secrets.token_urlsafe(48))"
docker compose up -d --force-recreate --wait
```

Enter that value in the app's **Administration** view. It stays in browser memory, never local storage or the URL. Lock the session when finished. This is a single-operator administrative credential, not a multi-user identity service. Rotate it by changing `.env` and recreating the container. Do not share it in a public demo.

## Develop locally

Use Python 3.10+ (CI/container: 3.12) and Node 22.13+.

```sh
python -m venv .venv
# Windows: .venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate
pip install -r backend/requirements.lock
npm ci
npm run build
python -m uvicorn backend.main:app --host 127.0.0.1 --port 5174
```

The production-style local command serves both layers. For hot reload, run the Python API on port 8000 and `npm run dev -- --port 5174 --strictPort` in another terminal. The Vite proxy targets that API; neither development server is a production host. Set `DATABASE_PATH` for a separate local SQLite file (default `data/atlas.sqlite3`). Do not point concurrent development and production services at the same file.

## Verify

```sh
python -m pytest backend/tests -q
npm run lint
npm run build
npx playwright install chromium
npx playwright test
python scripts/smoke.py http://127.0.0.1:5174
```

For browser tests against a running production container, set `TEST_BASE_URL=http://127.0.0.1:5174`; otherwise the test configuration starts local servers. Tests cover scoped traversal, source inspection, corrections and auth, filtering, disruption scenarios, comparisons, keyboard interaction and desktop/mobile accessibility. Automated map tests stub third-party tiles. Manual map verification uses OpenStreetMap with attribution.

## Research and operations

- [Source inventory and reuse constraints](docs/SOURCES.md)
- [Deployment and architecture](docs/DEPLOYMENT.md)
- [Ingestion and administration](docs/INGESTION.md)
- [Design system and extensions](docs/DESIGN.md)
- [Product visual provenance](docs/VISUALS.md)
- [Release status](docs/RELEASE.md)
- [Authoritative backlog](https://github.com/jsantoru/supply-atlas/issues) and [contribution workflow](CONTRIBUTING.md)

The collection is intentionally partial and historically scoped. Unknown does not mean absent. A single observed supplier does not prove sole sourcing. Part-level evidence can suggest upstream exposure, but remains visibly inferred when applied to a product. Generated product illustrations are navigational aids, not engineering geometry or sourcing evidence.

Public hosting requires a Docker-capable server, DNS and TLS. No paid infrastructure has been provisioned. Backup/restore features are excluded at the user's request.

CREATE TABLE source_snapshots (
    id INTEGER PRIMARY KEY,
    source_id TEXT NOT NULL REFERENCES sources(id),
    digest TEXT NOT NULL,
    fetch_url TEXT NOT NULL,
    body TEXT NOT NULL,
    source_json TEXT NOT NULL CHECK(json_valid(source_json)),
    retrieved_at TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','acknowledged','rejected')),
    reviewed_at TEXT,
    review_reason TEXT,
    UNIQUE(source_id,digest)
);
CREATE INDEX snapshot_queue ON source_snapshots(status,id);
CREATE TABLE curated_baselines (
    kind TEXT NOT NULL,
    record_id TEXT NOT NULL,
    digest TEXT NOT NULL,
    PRIMARY KEY(kind,record_id)
);

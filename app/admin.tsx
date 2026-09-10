import { useEffect, useRef, useState } from 'react';
import type { Atlas, Source } from './types';
import { api } from './types';
import { Picker, SourceLink } from './controls';
type Snapshot = {
  id: number;
  source_id: string;
  digest: string;
  status: 'pending' | 'acknowledged' | 'rejected';
  retrieved_at: string;
  reviewed_at: string | null;
  review_reason: string | null;
  affected_claim_ids: string[];
  fetch_url: string;
};
type SnapshotDetail = Snapshot & { body: string; source: Source };
type AdminStatus = {
  runs: {
    id: number;
    adapter: string;
    status: string;
    detail: string;
    created_at: string;
  }[];
  revisions: {
    id: number;
    kind: string;
    record_id: string;
    reason: string;
    created_at: string;
  }[];
  sources: { source_id: string; status: string; checked_at: string }[];
  review_queue: { id: string; status: string }[];
  snapshots: Snapshot[];
};
export default function Admin({
  data,
  onRefresh,
}: {
  data: Atlas;
  onRefresh: () => void;
}) {
  const [token, setToken] = useState('');
  const [status, setStatus] = useState<AdminStatus | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [kind, setKind] = useState('claim');
  const [id, setId] = useState(data.claims[0]?.id || '');
  const [record, setRecord] = useState(JSON.stringify(data.claims[0], null, 2));
  const [reason, setReason] = useState('');
  const [bundle, setBundle] = useState('');
  const [importReason, setImportReason] = useState('');
  const [snapshot, setSnapshot] = useState<SnapshotDetail | null>(null);
  const [snapshotReason, setSnapshotReason] = useState('');
  const generation = useRef(0);
  useEffect(
    () => () => {
      generation.current += 1;
    },
    [],
  );
  const adminApi = async <T,>(url: string, init: RequestInit): Promise<T> => {
    const started = generation.current;
    const result = await api<T>(url, init);
    if (started !== generation.current)
      throw new Error('Administration is locked.');
    return result;
  };
  const headers = {
    Authorization: 'Bearer ' + token,
    'Content-Type': 'application/json',
  };
  const items =
    kind === 'claim'
      ? data.claims
      : kind === 'entity'
        ? data.entities
        : data.sources;
  const run = async (fn: () => Promise<void>) => {
    const started = generation.current;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await fn();
    } catch (e) {
      if (started === generation.current) setError((e as Error).message);
    } finally {
      if (started === generation.current) setBusy(false);
    }
  };
  const load = async () => {
    setStatus(await adminApi<AdminStatus>('/api/admin/status', { headers }));
  };
  return (
    <div className="admin-view">
      {!status ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void run(load);
          }}
          className="admin-login"
        >
          <h2>Protected research administration</h2>
          <p>
            Enter the administrator token configured on the server. It stays in
            memory and is cleared when you leave or reload this page.
          </p>
          <label>
            Administrator token
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              autoComplete="off"
              required
              minLength={32}
            />
          </label>
          <button disabled={busy} className="cc-button">
            {busy ? 'Checking access…' : 'Unlock administration'}
          </button>
        </form>
      ) : (
        <>
          <div className="row-between">
            <h2>Research review desk</h2>
            <button
              className="cc-button cc-button--secondary"
              onClick={() => {
                generation.current += 1;
                setToken('');
                setStatus(null);
                setSnapshot(null);
                setSnapshotReason('');
                setReason('');
                setImportReason('');
                setBundle('');
                setError('');
                setMessage('');
                setBusy(false);
              }}
            >
              Lock administration
            </button>
          </div>
          <p>
            Corrections are validated and retained in an audit history. Add
            aliases to resolve names; preserve stable entity IDs. Keep competing
            claims as separate records and link them with “supersedes” only when
            justified.
          </p>
          <div className="admin-grid">
            <section>
              <h3>Review and correct a record</h3>
              <div className="compare-pickers">
                <Picker
                  label="Record type"
                  value={kind}
                  onChange={(v) => {
                    setKind(v);
                    const first = (
                      v === 'claim'
                        ? data.claims
                        : v === 'entity'
                          ? data.entities
                          : data.sources
                    )[0];
                    setId(first.id);
                    setRecord(JSON.stringify(first, null, 2));
                  }}
                  options={['claim', 'entity', 'source'].map((id) => ({
                    id,
                    name: id,
                  }))}
                />
                <Picker
                  label="Record"
                  value={id}
                  onChange={(v) => {
                    setId(v);
                    setRecord(
                      JSON.stringify(
                        items.find((i) => i.id === v),
                        null,
                        2,
                      ),
                    );
                  }}
                  options={items.map((i) => ({
                    id: i.id,
                    name: 'name' in i ? i.name : 'title' in i ? i.title : i.id,
                  }))}
                />
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void run(async () => {
                    await adminApi(`/api/admin/${kind}/${id}`, {
                      method: 'PUT',
                      headers,
                      body: JSON.stringify({
                        record: JSON.parse(record),
                        reason,
                      }),
                    });
                    setMessage('Record saved with audit history.');
                    onRefresh();
                    await load();
                  });
                }}
              >
                <label>
                  Record JSON
                  <textarea
                    className="record-editor"
                    value={record}
                    onChange={(e) => setRecord(e.target.value)}
                    required
                    spellCheck={false}
                  />
                </label>
                <label>
                  Reason for correction
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    minLength={10}
                    required
                    placeholder="What evidence supports this correction?"
                  />
                </label>
                <button disabled={busy} className="cc-button">
                  Save reviewed correction
                </button>
              </form>
            </section>
            <section>
              <h3>Ingestion and source checks</h3>
              <p>
                Automatic checks are limited to licensed documentation.
                Restricted websites require manual research. Changed sources
                need review before claims are updated.
              </p>
              <button
                disabled={busy}
                className="cc-button cc-button--secondary"
                onClick={() =>
                  void run(async () => {
                    const r = await adminApi<{ detail: string }>(
                      '/api/admin/refresh',
                      { method: 'POST', headers },
                    );
                    setMessage(r.detail);
                    await load();
                  })
                }
              >
                Check licensed documentation
              </button>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void run(async () => {
                    const r = await adminApi<{ changed: number }>(
                      '/api/admin/import',
                      {
                        method: 'POST',
                        headers,
                        body: JSON.stringify({
                          bundle: JSON.parse(bundle),
                          reason: importReason,
                        }),
                      },
                    );
                    setMessage(`${r.changed} records imported.`);
                    setBundle('');
                    onRefresh();
                    await load();
                  });
                }}
              >
                <label>
                  Reviewed collection JSON
                  <textarea
                    value={bundle}
                    onChange={(e) => setBundle(e.target.value)}
                    required
                    placeholder="A reviewed bundle containing entities, sources and claims"
                  />
                </label>
                <label>
                  Reason for reviewed import
                  <textarea
                    value={importReason}
                    onChange={(e) => setImportReason(e.target.value)}
                    minLength={10}
                    required
                    placeholder="Describe what was researched, resolved and reviewed."
                  />
                </label>
                <button disabled={busy} className="cc-button">
                  Import reviewed collection
                </button>
              </form>
              <h4>Review queue</h4>
              {status.review_queue.length ? (
                status.review_queue.map((c) => (
                  <button
                    className="list-link"
                    key={c.id}
                    onClick={() => {
                      setKind('claim');
                      setId(c.id);
                      setRecord(
                        JSON.stringify(
                          data.claims.find((x) => x.id === c.id),
                          null,
                          2,
                        ),
                      );
                    }}
                  >
                    {c.id} · {c.status}
                  </button>
                ))
              ) : (
                <p>No non-direct claims. Source changes are listed below.</p>
              )}
              {status.sources.map((s) => (
                <p key={s.source_id}>
                  {s.source_id}: <strong>{s.status}</strong>
                  <small>{s.checked_at}</small>
                </p>
              ))}
              <h4>Licensed source snapshots</h4>
              <p>
                Read the retained document and inspect affected claims before
                acknowledging a source change. Acknowledgement records your
                review; corrections are saved separately.
              </p>
              {status.snapshots?.length ? (
                status.snapshots.map((s) => (
                  <button
                    className="list-link"
                    key={s.id}
                    onClick={() =>
                      void run(async () => {
                        setSnapshot(
                          await adminApi<SnapshotDetail>(
                            `/api/admin/snapshots/${s.id}`,
                            { headers },
                          ),
                        );
                        setSnapshotReason('');
                      })
                    }
                  >
                    <span>
                      {data.sources.find((x) => x.id === s.source_id)?.title ||
                        s.source_id}
                      <small>
                        {s.retrieved_at} · {s.status} ·{' '}
                        {s.affected_claim_ids.length} affected claims
                      </small>
                    </span>
                  </button>
                ))
              ) : (
                <p>
                  No retained source snapshots. Check licensed documentation to
                  fetch the first review copy.
                </p>
              )}
              {snapshot && (
                <section
                  className="source-snapshot"
                  aria-label="Source snapshot review"
                >
                  <div className="row-between">
                    <h4>{snapshot.source.title}</h4>
                    <button
                      className="text-link"
                      onClick={() => setSnapshot(null)}
                    >
                      Close snapshot
                    </button>
                  </div>
                  <p>
                    {snapshot.source.publisher} · {snapshot.source.license}
                  </p>
                  <p>{snapshot.source.reuse}</p>
                  <SourceLink href={snapshot.source.url}>
                    Original publication
                  </SourceLink>
                  {' · '}
                  <SourceLink href={snapshot.source.terms_url}>
                    Reuse terms
                  </SourceLink>
                  <p>
                    Retrieved {snapshot.retrieved_at} · {snapshot.status}
                  </p>
                  <details>
                    <summary>Document fingerprint and fetch location</summary>
                    <p>{snapshot.digest}</p>
                    <SourceLink href={snapshot.fetch_url}>
                      Licensed document URL
                    </SourceLink>
                  </details>
                  <pre aria-label="Retained licensed source text">
                    {snapshot.body}
                  </pre>
                  <h4>Affected claims</h4>
                  {snapshot.affected_claim_ids.map((claimId) => (
                    <button
                      className="list-link"
                      key={claimId}
                      onClick={() => {
                        setKind('claim');
                        setId(claimId);
                        setRecord(
                          JSON.stringify(
                            data.claims.find((c) => c.id === claimId),
                            null,
                            2,
                          ),
                        );
                        document
                          .querySelector<HTMLTextAreaElement>('.record-editor')
                          ?.focus();
                      }}
                    >
                      {claimId} · open in correction editor
                    </button>
                  ))}
                  {snapshot.status === 'pending' ? (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        const decision =
                          (
                            e.nativeEvent as SubmitEvent
                          ).submitter?.getAttribute('value') || 'acknowledged';
                        void run(async () => {
                          await adminApi(
                            `/api/admin/snapshots/${snapshot.id}/review`,
                            {
                              method: 'POST',
                              headers,
                              body: JSON.stringify({
                                digest: snapshot.digest,
                                decision,
                                reason: snapshotReason,
                              }),
                            },
                          );
                          setMessage(
                            `Snapshot ${decision}. Claims have not been changed automatically.`,
                          );
                          setSnapshot(null);
                          await load();
                        });
                      }}
                    >
                      <label>
                        Source review reason
                        <textarea
                          value={snapshotReason}
                          onChange={(e) => setSnapshotReason(e.target.value)}
                          minLength={10}
                          required
                          placeholder="Explain findings and any corrections needed."
                        />
                      </label>
                      <div className="compare-pickers">
                        <button
                          className="cc-button"
                          value="acknowledged"
                          disabled={busy}
                        >
                          Acknowledge review
                        </button>
                        <button
                          className="cc-button cc-button--secondary"
                          value="rejected"
                          disabled={busy}
                        >
                          Reject snapshot
                        </button>
                      </div>
                    </form>
                  ) : (
                    <p>
                      {snapshot.review_reason} · Reviewed {snapshot.reviewed_at}
                    </p>
                  )}
                </section>
              )}
            </section>
          </div>
          <section>
            <h3>Recent ingestion runs</h3>
            {status.runs.map((r) => (
              <div className="audit-row" key={r.id}>
                <strong>
                  {r.adapter} · {r.status}
                </strong>
                <span>{r.detail}</span>
                <small>{r.created_at}</small>
              </div>
            ))}
          </section>
          <details>
            <summary>
              Correction history ({status.revisions.length} most recent)
            </summary>
            {status.revisions.map((r) => (
              <div className="audit-row" key={r.id}>
                <strong>
                  {r.kind} / {r.record_id}
                </strong>
                <span>{r.reason}</span>
                <small>{r.created_at}</small>
              </div>
            ))}
          </details>
        </>
      )}
      {error && (
        <p role="alert" className="notice error">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="notice">
          {message}
        </p>
      )}
      {busy && <p role="status">Working…</p>}
    </div>
  );
}

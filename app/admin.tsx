import { useState } from 'react';
import type { Atlas } from './types';
import { api } from './types';
import { Picker } from './controls';
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
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await fn();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const load = async () => {
    setStatus(await api<AdminStatus>('/api/admin/status', { headers }));
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
                setToken('');
                setStatus(null);
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
                    await api(`/api/admin/${kind}/${id}`, {
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
                    const r = await api<{ detail: string }>(
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
                    const r = await api<{ changed: number }>(
                      '/api/admin/import',
                      { method: 'POST', headers, body: bundle },
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

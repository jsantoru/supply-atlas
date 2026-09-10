import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Box,
  Check,
  ChevronRight,
  CircleHelp,
  Compass,
  Factory,
  FileText,
  FlaskConical,
  GitCompareArrows,
  Layers3,
  Link,
  Network as NetworkIcon,
  Search,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { api, roles, type Atlas, type Network } from './types';
import {
  EntityIcon,
  Empty,
  ErrorState,
  Picker,
  SourceLink,
  Status,
} from './controls';
import { EntityDetails, EvidenceCard } from './evidence';
import NetworkView from './network';
import { CompareView, RiskView } from './analysis-views';
const FactoryMap = lazy(() => import('./factory-map'));
const Admin = lazy(() => import('./admin'));
const views = [
  { id: 'network', name: 'Supply network', icon: NetworkIcon },
  { id: 'breakdown', name: 'Components', icon: Layers3 },
  { id: 'map', name: 'Factory map', icon: Factory },
  { id: 'compare', name: 'Compare', icon: GitCompareArrows },
];
function useUrl() {
  const [params, setParams] = useState(
    () => new URLSearchParams(location.search),
  );
  useEffect(() => {
    const pop = () => setParams(new URLSearchParams(location.search));
    addEventListener('popstate', pop);
    return () => removeEventListener('popstate', pop);
  }, []);
  const update = (values: Record<string, string>) => {
    const p = new URLSearchParams(location.search);
    Object.entries(values).forEach(([k, v]) => (v ? p.set(k, v) : p.delete(k)));
    history.pushState(null, '', '?' + p.toString());
    setParams(p);
  };
  return [params, update] as const;
}
export default function App() {
  const [params, update] = useUrl();
  const product = params.get('product') || 'pi5';
  const view = params.get('view') || 'network';
  const status = params.get('status') || 'all';
  const role = params.get('role') || 'all';
  const depth = params.get('depth') || '2';
  const at = params.get('at') || '';
  const variant = params.get('variant') || '';
  const supplier = params.get('supplier') || '';
  const part = params.get('part') || '';
  const industry = params.get('industry') || '';
  const selected = params.get('entity') || '';
  const claimId = params.get('claim') || '';
  const [data, setData] = useState<Atlas | null>(null);
  const [network, setNetwork] = useState<Network | null>(null);
  const [error, setError] = useState('');
  const [networkError, setNetworkError] = useState('');
  const [retry, setRetry] = useState(0);
  const [query, setQuery] = useState(params.get('q') || '');
  const [searchOpen, setSearchOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [advanced, setAdvanced] = useState(false);
  const [collapsed, setCollapsed] = useState<string[]>([]);
  const filters = new URLSearchParams({
    status,
    role,
    ...(at ? { at } : {}),
    ...(variant ? { variant } : {}),
    ...(supplier ? { supplier } : {}),
    ...(part ? { part } : {}),
  }).toString();
  useEffect(() => {
    const c = new AbortController();
    setError('');
    api<Atlas>('/api/atlas', { signal: c.signal })
      .then(setData)
      .catch((e) => {
        if (e.name !== 'AbortError') setError(e.message);
      });
    return () => c.abort();
  }, [retry]);
  useEffect(() => {
    const c = new AbortController();
    setNetwork(null);
    setNetworkError('');
    api<Network>(`/api/graph/${product}?depth=${depth}&${filters}`, {
      signal: c.signal,
    })
      .then(setNetwork)
      .catch((e) => {
        if (e.name !== 'AbortError') setNetworkError(e.message);
      });
    return () => c.abort();
  }, [product, depth, filters, retry]);
  const openEntity = (id: string) => update({ entity: id, claim: '' });
  const openClaim = (id: string) => update({ claim: id, entity: '' });
  const openProduct = (id: string) =>
    update({
      product: id,
      entity: '',
      claim: '',
      variant: '',
      view: ['risk', 'directory', 'sources', 'admin'].includes(view)
        ? 'network'
        : view,
    });
  const facilities = useMemo(
    () =>
      data?.entities.filter(
        (e) =>
          e.kind === 'facility' &&
          (!industry || e.industry_id === industry) &&
          network?.claims.some((c) => c.facility_id === e.id),
      ) || [],
    [data, network, industry],
  );
  if (error)
    return <ErrorState error={error} retry={() => setRetry((v) => v + 1)} />;
  if (!data)
    return (
      <main className="initial-loading">
        <Compass size={36} />
        <h1>Supply Atlas</h1>
        <p role="status">Loading the researched collection…</p>
        <Skeleton className="h-32 w-full" />
      </main>
    );
  const entity = data.entities.find((e) => e.id === product);
  const current = data.entities.find((e) => e.id === selected);
  const claim = data.claims.find((c) => c.id === claimId);
  const products = data.entities.filter((e) => e.kind === 'product');
  const name = (id: string | null) =>
    data.entities.find((e) => e.id === id)?.name || 'Unknown';
  const results = data.entities
    .filter((e) =>
      (e.name + ' ' + e.aliases.join(' ') + ' ' + e.description)
        .toLowerCase()
        .includes(query.toLowerCase()),
    )
    .slice(0, 12);
  const directClaims =
    network?.claims.filter((c) => c.product_id === product) || [];
  const partIds = [
    ...new Set(
      directClaims.map((c) => c.part_id).filter((v): v is string => !!v),
    ),
  ];
  const supplierCount = new Set(
    network?.claims.map((c) => c.supplier_id).filter(Boolean),
  ).size;
  const missing = network?.claims.filter((c) => !c.facility_id).length || 0;
  const share = async () => {
    try {
      await navigator.clipboard.writeText(location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
      window.prompt('Copy this research view URL', location.href);
    }
  };
  return (
    <SidebarProvider
      className="cc"
      style={{ '--sidebar-width': '218px' } as React.CSSProperties}
    >
      <a className="skip-link" href="#workspace">
        Skip to workspace
      </a>
      <Sidebar className="atlas-sidebar">
        <div className="brand">
          <Compass size={29} />
          <span>
            Supply<span className="brand-light"> Atlas</span>
          </span>
        </div>
        <SidebarContent>
          <SidebarGroup>
            <p className="nav-label">Workspace</p>
            <SidebarMenu>
              {[
                { id: 'network', name: 'Explore', icon: Compass },
                { id: 'directory', name: 'Entity directory', icon: Layers3 },
                { id: 'risk', name: 'Risk exploration', icon: FlaskConical },
                { id: 'sources', name: 'Evidence library', icon: BookOpen },
              ].map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    isActive={
                      item.id === 'network'
                        ? ['network', 'breakdown', 'map', 'compare'].includes(
                            view,
                          )
                        : view === item.id
                    }
                    onClick={() =>
                      update({ view: item.id, entity: '', claim: '' })
                    }
                  >
                    <item.icon size={18} />
                    <span>{item.name}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
          <SidebarGroup className="product-nav">
            <p className="nav-label">
              Research collection <span>{products.length}</span>
            </p>
            {products.map((p) => (
              <button
                key={p.id}
                className={product === p.id ? 'active' : ''}
                onClick={() => openProduct(p.id)}
              >
                <Box size={16} />
                <span>{p.name.replace('Raspberry Pi ', 'Pi ')}</span>
                {product === p.id && <span className="active-dot" />}
              </button>
            ))}
          </SidebarGroup>
          <div className="collection-note">
            <span className="tiny-label">Collection 01</span>
            <strong>Inside the computer</strong>
            <p>Consumer electronics & semiconductor dependencies</p>
            <span className="collection-status">
              <span /> Researched · partial coverage
            </span>
          </div>
        </SidebarContent>
        <SidebarFooter>
          <button
            className="admin-nav"
            onClick={() => update({ view: 'admin', entity: '', claim: '' })}
          >
            <Settings2 size={17} />
            Data administration
          </button>
          <div className="sidebar-bottom">
            <ShieldCheck size={15} /> Evidence before assumptions
          </div>
        </SidebarFooter>
      </Sidebar>
      <div className="app-shell">
        <header className="topbar">
          <SidebarTrigger aria-label="Toggle navigation" />
          <div className="global-search">
            <Search size={18} />
            <input
              aria-label="Search all entities"
              placeholder="Search products, suppliers, components…"
              value={query}
              onFocus={() => setSearchOpen(true)}
              onChange={(e) => {
                setQuery(e.target.value);
                setSearchOpen(true);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setSearchOpen(false);
                if (e.key === 'Enter') {
                  update({ view: 'directory', q: query });
                  setSearchOpen(false);
                }
              }}
            />
            <kbd>↵</kbd>
            {searchOpen && query && (
              <div className="search-results">
                <div className="row-between">
                  <span>Search the collection</span>
                  <button onClick={() => setSearchOpen(false)}>Close</button>
                </div>
                {results.length ? (
                  results.map((e) => (
                    <button
                      key={e.id}
                      onClick={() => {
                        setSearchOpen(false);
                        openEntity(e.id);
                      }}
                    >
                      <EntityIcon kind={e.kind} />
                      <span>
                        {e.name}
                        <small>{e.kind}</small>
                      </span>
                      <ArrowUpRight size={16} />
                    </button>
                  ))
                ) : (
                  <p>No matching entities. Try a part number or alias.</p>
                )}
              </div>
            )}
          </div>
          <span className="research-label">
            <span />
            Research workspace
          </span>
          <button
            className="help-button"
            aria-label="About coverage"
            onClick={() => update({ view: 'sources' })}
          >
            <CircleHelp size={19} />
          </button>
        </header>
        <main id="workspace">
          <nav className="breadcrumbs" aria-label="Breadcrumb">
            <button onClick={() => update({ view: 'directory', q: '' })}>
              Collection
            </button>
            <ChevronRight size={13} />
            <button onClick={() => openEntity('electronics')}>
              Consumer electronics
            </button>
            <ChevronRight size={13} />
            <span>{entity?.name || 'Unknown product'}</span>
          </nav>
          <section className="product-heading">
            <div>
              <div className="eyebrow">
                Product intelligence{' '}
                <span className="tag">Partial breakdown</span>
              </div>
              <h1>
                {['directory', 'sources', 'risk', 'admin'].includes(view)
                  ? (
                      {
                        directory: 'Explore the collection',
                        sources: 'The evidence behind the atlas',
                        risk: 'Explore dependency exposure',
                        admin: 'Data administration',
                      } as Record<string, string>
                    )[view]
                  : entity?.name || 'Product not found'}
              </h1>
              <p>
                {['directory', 'sources', 'risk', 'admin'].includes(view)
                  ? 'Traceable relationships. Visible uncertainty.'
                  : entity?.description.split('. A documented')[0]}
              </p>
            </div>
            <div className="heading-actions">
              <button
                className="cc-button cc-button--secondary"
                onClick={share}
              >
                {copied ? <Check size={16} /> : <Link size={16} />}{' '}
                {copied ? 'Link copied' : 'Share view'}
              </button>
              <button
                className="cc-button"
                onClick={() => update({ view: 'risk', target: 'pencoed' })}
              >
                <FlaskConical size={16} />
                Explore disruption
              </button>
            </div>
          </section>
          {!['directory', 'sources', 'risk', 'admin'].includes(view) && (
            <>
              <section
                className="facts-strip"
                aria-label="Coverage of this view"
              >
                <div>
                  <CpuIcon />
                  <span>
                    <strong>{partIds.length}</strong>Documented parts
                  </span>
                </div>
                <div>
                  <Factory size={20} />
                  <span>
                    <strong>{supplierCount}</strong>Known suppliers
                  </span>
                </div>
                <div>
                  <Compass size={20} />
                  <span>
                    <strong>{facilities.length}</strong>Located facilities
                  </span>
                </div>
                <div className="gap-stat">
                  <CircleHelp size={20} />
                  <span>
                    <strong>{missing}</strong>Claims with location gaps
                  </span>
                </div>
              </section>
              <Tabs
                value={view}
                onValueChange={(v) => update({ view: String(v) })}
              >
                <TabsList className="view-tabs" variant="line">
                  {views.map((v) => (
                    <TabsTrigger key={v.id} value={v.id}>
                      <v.icon size={17} />
                      {v.name}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </>
          )}
          {view !== 'admin' && view !== 'sources' && view !== 'directory' && (
            <div className="filters">
              <SlidersHorizontal size={17} />
              <Picker
                label="Evidence"
                value={status}
                onChange={(v) => update({ status: v })}
                options={[
                  'all',
                  'direct',
                  'inferred',
                  'disputed',
                  'outdated',
                ].map((id) => ({
                  id,
                  name:
                    id === 'all'
                      ? 'All evidence'
                      : id === 'direct'
                        ? 'Direct evidence'
                        : id[0].toUpperCase() + id.slice(1),
                }))}
              />
              <Picker
                label="Role"
                value={role}
                onChange={(v) => update({ role: v })}
                options={roles.map((id) => ({
                  id,
                  name:
                    id === 'all'
                      ? 'All roles'
                      : id[0].toUpperCase() + id.slice(1),
                }))}
              />
              {view === 'network' && (
                <Picker
                  label="Depth"
                  value={depth}
                  onChange={(v) => update({ depth: v })}
                  options={[1, 2, 3].map((n) => ({
                    id: String(n),
                    name: n + ' ' + (n === 1 ? 'level' : 'levels'),
                  }))}
                />
              )}
              <button
                className="filter-more"
                onClick={() => setAdvanced((v) => !v)}
                aria-expanded={advanced}
              >
                Time & variant
              </button>
              {(role !== 'all' ||
                status !== 'all' ||
                at ||
                variant ||
                supplier ||
                part ||
                industry) && (
                <button
                  className="text-link"
                  onClick={() =>
                    update({
                      role: 'all',
                      status: 'all',
                      at: '',
                      variant: '',
                      supplier: '',
                      part: '',
                      industry: '',
                    })
                  }
                >
                  Reset filters
                </button>
              )}
            </div>
          )}
          {advanced && (
            <div className="advanced-filters">
              <label>
                Evidence known by
                <input
                  type="date"
                  aria-label="Evidence known by"
                  value={at}
                  onChange={(e) => update({ at: e.target.value })}
                />
              </label>
              <Picker
                label="Product variant"
                value={variant || 'all'}
                onChange={(v) => update({ variant: v === 'all' ? '' : v })}
                options={[
                  { id: 'all', name: 'All / unspecified' },
                  ...data.entities.filter(
                    (e) => e.kind === 'variant' && e.parent_id === product,
                  ),
                ]}
              />
              <p>
                Unspecified variant claims remain visible and do not confirm
                variant-specific sourcing.
              </p>
            </div>
          )}
          {view === 'map' && (
            <div className="filters map-filters">
              <Picker
                label="Company"
                value={supplier || 'all'}
                onChange={(v) => update({ supplier: v === 'all' ? '' : v })}
                options={[
                  { id: 'all', name: 'All companies' },
                  ...data.entities.filter((e) => e.kind === 'company'),
                ]}
              />
              <Picker
                label="Component"
                value={part || 'all'}
                onChange={(v) => update({ part: v === 'all' ? '' : v })}
                options={[
                  { id: 'all', name: 'All parts' },
                  ...data.entities.filter((e) => e.kind === 'part'),
                ]}
              />
              <Picker
                label="Industry"
                value={industry || 'all'}
                onChange={(v) => update({ industry: v === 'all' ? '' : v })}
                options={[
                  { id: 'all', name: 'All industries' },
                  ...data.entities.filter((e) => e.kind === 'industry'),
                ]}
              />
            </div>
          )}
          {view === 'directory' ? (
            <section className="directory">
              <div className="directory-filters">
                <label>
                  Search entities
                  <input
                    aria-label="Filter directory"
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      update({ q: e.target.value });
                    }}
                    placeholder="Name, part number or alias"
                  />
                </label>
                <Picker
                  label="Entity type"
                  value={params.get('kind') || 'all'}
                  onChange={(v) => update({ kind: v })}
                  options={[
                    'all',
                    'product',
                    'company',
                    'part',
                    'category',
                    'facility',
                    'material',
                    'industry',
                    'region',
                    'variant',
                  ].map((id) => ({
                    id,
                    name:
                      id === 'all'
                        ? 'All entity types'
                        : id[0].toUpperCase() + id.slice(1),
                  }))}
                />
              </div>
              <div className="entity-grid">
                {!data.entities.some(
                  (e) =>
                    (!params.get('kind') ||
                      params.get('kind') === 'all' ||
                      e.kind === params.get('kind')) &&
                    (e.name + ' ' + e.description + ' ' + e.aliases.join(' '))
                      .toLowerCase()
                      .includes(query.toLowerCase()),
                ) && <Empty />}
                {data.entities
                  .filter(
                    (e) =>
                      (!params.get('kind') ||
                        params.get('kind') === 'all' ||
                        e.kind === params.get('kind')) &&
                      (e.name + ' ' + e.description + ' ' + e.aliases.join(' '))
                        .toLowerCase()
                        .includes(query.toLowerCase()),
                  )
                  .map((e) => (
                    <button
                      className="entity-card"
                      key={e.id}
                      onClick={() => openEntity(e.id)}
                    >
                      <EntityIcon kind={e.kind} size={24} />
                      <span className="eyebrow">{e.kind}</span>
                      <h3>{e.name}</h3>
                      <p>{e.description}</p>
                      <span className="text-link">
                        Inspect relationships <ArrowRight size={15} />
                      </span>
                    </button>
                  ))}
              </div>
            </section>
          ) : view === 'sources' ? (
            <section className="source-library">
              <div className="notice">
                <h2>What this collection can tell you</h2>
                <p>{data.coverage}</p>
                <p>
                  Five products, selected semiconductor dependencies, and one
                  documented assembly facility. Memory sourcing, packaging
                  sites, material suppliers and specific chip fabs are not
                  established. Data is researched; no demonstration
                  relationships are mixed in.
                </p>
              </div>
              {data.sources.map((s) => (
                <article key={s.id}>
                  <div>
                    <span className="eyebrow">{s.publisher}</span>
                    <h3>{s.title}</h3>
                    <p>
                      {s.published || 'Publication date unavailable'} ·
                      Retrieved {s.retrieved}
                    </p>
                    <p>{s.license}</p>
                    <p>{s.reuse}</p>
                  </div>
                  <SourceLink href={s.url}>Original source</SourceLink>
                </article>
              ))}
            </section>
          ) : view === 'risk' ? (
            <RiskView
              data={data}
              target={params.get('target') || 'pencoed'}
              setTarget={(id) => update({ target: id })}
              filters={filters}
              onProduct={openProduct}
              onClaim={openClaim}
            />
          ) : view === 'admin' ? (
            <Suspense fallback={<p>Loading administration…</p>}>
              <Admin data={data} onRefresh={() => setRetry((v) => v + 1)} />
            </Suspense>
          ) : view === 'compare' ? (
            <CompareView
              data={data}
              left={params.get('left') || product}
              setLeft={(id) => update({ left: id })}
              other={params.get('other') || 'pi500'}
              setOther={(id) => update({ other: id })}
              filters={filters}
              onEntity={openEntity}
            />
          ) : (
            <div className="workspace-grid">
              <section className="visual-panel">
                <div className="panel-heading">
                  <div>
                    <h2>
                      {view === 'network'
                        ? 'A connected view of your product'
                        : view === 'map'
                          ? 'Where manufacturing is documented'
                          : 'Inside the product'}
                    </h2>
                    <p>
                      {view === 'network'
                        ? 'Follow a connection to inspect its evidence.'
                        : view === 'map'
                          ? 'Only facilities tied to scoped claims appear here.'
                          : 'Component categories → specific parts → documented suppliers.'}
                    </p>
                  </div>
                  <span className="panel-count">
                    {network?.claims.length || 0} claims
                  </span>
                </div>
                {networkError ? (
                  <ErrorState
                    error={networkError}
                    retry={() => setRetry((v) => v + 1)}
                  />
                ) : !network ? (
                  <div className="network-loading" role="status">
                    <Skeleton className="h-60 w-full" />
                    <p>Loading documented dependencies…</p>
                  </div>
                ) : view === 'network' ? (
                  <NetworkView
                    key={product}
                    network={network}
                    selected={selected}
                    onEntity={openEntity}
                    onClaim={openClaim}
                  />
                ) : view === 'map' ? (
                  <Suspense fallback={<p>Loading map…</p>}>
                    <FactoryMap facilities={facilities} onSelect={openEntity} />
                  </Suspense>
                ) : (
                  <div className="breakdown-table">
                    {partIds.length ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Component / specific part</TableHead>
                            <TableHead>Supplier & role</TableHead>
                            <TableHead>Manufacturing location</TableHead>
                            <TableHead>Evidence</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {data.entities
                            .filter(
                              (e) =>
                                e.kind === 'category' &&
                                partIds.some(
                                  (id) =>
                                    data.entities.find((p) => p.id === id)
                                      ?.category_id === e.id,
                                ),
                            )
                            .flatMap((category) => [
                              <TableRow
                                key={category.id}
                                className="category-row"
                              >
                                <TableCell colSpan={4}>
                                  <button
                                    onClick={() =>
                                      setCollapsed((v) =>
                                        v.includes(category.id)
                                          ? v.filter((x) => x !== category.id)
                                          : [...v, category.id],
                                      )
                                    }
                                    aria-expanded={
                                      !collapsed.includes(category.id)
                                    }
                                  >
                                    <ChevronRight
                                      size={15}
                                      className={
                                        collapsed.includes(category.id)
                                          ? ''
                                          : 'rotated'
                                      }
                                    />
                                    {category.name}
                                  </button>
                                </TableCell>
                              </TableRow>,
                              ...(!collapsed.includes(category.id)
                                ? partIds
                                    .filter(
                                      (id) =>
                                        data.entities.find((p) => p.id === id)
                                          ?.category_id === category.id,
                                    )
                                    .flatMap((id) =>
                                      network.claims
                                        .filter((c) => c.part_id === id)
                                        .map((c) => (
                                          <TableRow key={c.id}>
                                            <TableCell>
                                              <button
                                                className="part-name"
                                                onClick={() => openEntity(id)}
                                              >
                                                <EntityIcon kind="part" />
                                                {name(id)}
                                              </button>
                                              {!c.product_id && (
                                                <small className="inference-note">
                                                  Part-level upstream link
                                                </small>
                                              )}
                                            </TableCell>
                                            <TableCell>
                                              <button
                                                className="text-link"
                                                onClick={() =>
                                                  c.supplier_id &&
                                                  openEntity(c.supplier_id)
                                                }
                                              >
                                                {name(c.supplier_id)}
                                              </button>
                                              <small>{c.role}</small>
                                            </TableCell>
                                            <TableCell>
                                              {c.facility_id ? (
                                                <button
                                                  className="text-link"
                                                  onClick={() =>
                                                    openEntity(c.facility_id!)
                                                  }
                                                >
                                                  {name(c.facility_id)}
                                                </button>
                                              ) : (
                                                <span className="muted">
                                                  Not established
                                                </span>
                                              )}
                                            </TableCell>
                                            <TableCell>
                                              <button
                                                className="evidence-button"
                                                onClick={() => openClaim(c.id)}
                                              >
                                                <Status
                                                  value={
                                                    c.product_id
                                                      ? c.status
                                                      : 'inferred'
                                                  }
                                                />
                                                <ArrowUpRight size={14} />
                                              </button>
                                            </TableCell>
                                          </TableRow>
                                        )),
                                    )
                                : []),
                            ])}
                        </TableBody>
                      </Table>
                    ) : (
                      <Empty />
                    )}
                  </div>
                )}
              </section>
              <aside className="context-panel">
                <div className="context-title">
                  <FileText size={18} />
                  <h2>Research context</h2>
                </div>
                <span className="eyebrow">Understanding coverage</span>
                <h3>
                  A partial picture.
                  <br />A clear evidence trail.
                </h3>
                <p>
                  This is a documented slice of the supply chain. Every
                  connection points to a source; missing connections stay
                  visible.
                </p>
                <div className="coverage-box">
                  <div>
                    <Check size={17} />
                    <strong>
                      {directClaims.length} product-specific claims
                    </strong>
                  </div>
                  <p>
                    Supported by identified publications. Dates and scope are
                    attached to each claim.
                  </p>
                </div>
                <div className="coverage-box warm">
                  <div>
                    <CircleHelp size={17} />
                    <strong>Manufacturing gaps remain</strong>
                  </div>
                  <p>
                    {missing} claims do not identify a facility. A supplier’s
                    location does not locate its factories.
                  </p>
                </div>
                <h4>Start with a documented path</h4>
                {directClaims.find((c) => c.facility_id) ? (
                  <button
                    className="suggested-path"
                    onClick={() =>
                      openClaim(directClaims.find((c) => c.facility_id)!.id)
                    }
                  >
                    <Factory size={20} />
                    <span>
                      <strong>Sony → Pi 5 board</strong>
                      <small>Pencoed, Wales · Assembly</small>
                    </span>
                    <ArrowRight size={16} />
                  </button>
                ) : directClaims[0] ? (
                  <button
                    className="suggested-path"
                    onClick={() => openClaim(directClaims[0].id)}
                  >
                    <EntityIcon kind="part" />
                    <span>Inspect a component claim</span>
                    <ArrowRight size={16} />
                  </button>
                ) : (
                  <p>No claims match the filters.</p>
                )}
                <button
                  className="text-link"
                  onClick={() => openEntity(product)}
                >
                  Open product profile <ArrowRight size={14} />
                </button>
                <div className="context-bottom">
                  <BookOpen size={16} />
                  <span>
                    Source dates vary. Current sourcing is not guaranteed.
                  </span>
                </div>
              </aside>
            </div>
          )}
          <footer className="workspace-footer">
            <span>
              <ShieldCheck size={14} /> Evidence-led exploration
            </span>
            <span>Unknown ≠ absent · Documented supplier ≠ sole source</span>
          </footer>
        </main>
      </div>
      <Sheet
        open={!!(selected || claimId)}
        onOpenChange={(v) => {
          if (!v) update({ entity: '', claim: '' });
        }}
      >
        <SheetContent className="detail-sheet">
          <SheetHeader>
            <span className="eyebrow">
              {claim ? 'Claim evidence' : current?.kind || 'Record'}
            </span>
            <SheetTitle>
              {claim
                ? `${name(claim.part_id)} · ${claim.role}`
                : current?.name || 'Record not found'}
            </SheetTitle>
            <SheetDescription>
              Scope, supporting evidence and known limitations
            </SheetDescription>
          </SheetHeader>
          <div className="detail-body">
            {claim ? (
              <EvidenceCard claim={claim} data={data} onEntity={openEntity} />
            ) : current ? (
              <EntityDetails
                entity={current}
                data={data}
                onEntity={openEntity}
                onClaim={openClaim}
                onProduct={openProduct}
                onScenario={(id) =>
                  update({ view: 'risk', target: id, entity: '', claim: '' })
                }
              />
            ) : (
              <Empty title="Record not found" />
            )}
          </div>
        </SheetContent>
      </Sheet>
    </SidebarProvider>
  );
}
function CpuIcon() {
  return <Layers3 size={20} />;
}

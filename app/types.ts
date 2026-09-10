export type Entity = {
  id: string;
  kind: string;
  name: string;
  description: string;
  aliases: string[];
  category_id: string | null;
  parent_id: string | null;
  industry_id: string | null;
  region_id: string | null;
  latitude: number | null;
  longitude: number | null;
  precision: string;
  location_reference: string | null;
};
export type Source = {
  id: string;
  title: string;
  url: string;
  publisher: string;
  published: string | null;
  retrieved: string;
  license: string;
  terms_url: string;
  reuse: string;
  adapter: string;
};
export type Claim = {
  context_status?: string;
  id: string;
  supplier_id: string | null;
  customer_id: string | null;
  part_id: string | null;
  product_id: string | null;
  facility_id: string | null;
  material_id: string | null;
  variant_id: string | null;
  region_id: string | null;
  role: string;
  status: string;
  observed_at: string;
  valid_from: string | null;
  valid_to: string | null;
  period: string;
  uncertainty: string;
  evidence: { source_id: string; reference: string }[];
  supersedes: string | null;
};
export type Atlas = {
  entities: Entity[];
  sources: Source[];
  claims: Claim[];
  coverage: string;
  research?: Record<string, { system_count: number; entry_count: number }>;
};
export type Edge = {
  id: string;
  source: string;
  target: string;
  label: string;
  claim_id: string;
  anchor_claim_ids: string[];
  product_context: string;
  status: string;
  upstream: boolean;
};
export type Network = { nodes: Entity[]; edges: Edge[]; claims: Claim[] };
export async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const r = await fetch(url, init);
  if (!r.ok) {
    const error = await r
      .json()
      .catch(() => ({ detail: 'The server could not complete this request.' }));
    throw new Error(
      typeof error.detail === 'string'
        ? error.detail
        : JSON.stringify(error.detail),
    );
  }
  return r.json();
}
export const roles = [
  'all',
  'designer',
  'fabricator',
  'component supplier',
  'assembler',
  'packager',
  'distributor',
  'material supplier',
];

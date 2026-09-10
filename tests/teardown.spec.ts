import { test, expect } from '@playwright/test';

test('every researched product has an illustration and a working studio', async ({
  page,
  request,
}) => {
  const atlas = await (await request.get('/api/atlas')).json();
  const products = atlas.entities.filter(
    (e: { kind: string }) => e.kind === 'product',
  );
  expect(products.length).toBe(12);
  for (const product of products) {
    const asset = await request.get(`/products/${product.id}.png`);
    expect(asset.headers()['content-type']).toContain('image/png');
    expect((await asset.body()).subarray(0, 4).toString('hex')).toBe(
      '89504e47',
    );
    await page.goto(`/?product=${product.id}&view=teardown`);
    await expect(
      page.getByRole('heading', { name: product.name, exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole('img', {
        name: new RegExp(`AI-generated illustrative rendering`),
      }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', {
        name:
          product.id === 'lucas'
            ? 'Explode exterior'
            : atlas.research?.[product.id]
              ? 'Separate system cards'
              : 'Explode components',
        exact: true,
      }),
    ).toBeVisible();
  }
});

test('studio retains scoped upstream facilities and disputed allocation status', async ({
  page,
  request,
}) => {
  // Isolated browser fixture: never imported into the researched database.
  const atlas = await (await request.get('/api/atlas')).json();
  const upstream = {
    ...atlas.claims.find((c: { id: string }) => c.id === 'rp1-fabrication'),
    facility_id: 'pencoed',
    context_status: 'disputed',
  };
  await page.route('**/api/graph/pi500?*', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        nodes: atlas.entities,
        edges: [],
        claims: [upstream],
      }),
    }),
  );
  await page.goto('/?product=pi500&view=teardown&status=disputed');
  const inspector = page.getByRole('complementary', {
    name: 'Selected component sourcing',
  });
  await expect(
    inspector.getByText('RP1', { exact: true }).first(),
  ).toBeVisible();
  await expect(inspector.getByText('Disputed', { exact: true })).toBeVisible();
  const origins = page.getByRole('region', {
    name: 'Documented manufacturing locations',
  });
  await expect(
    origins.getByRole('heading', { name: 'Sony UK Technology Centre' }),
  ).toBeVisible();
  await expect(origins.getByText('Disputed', { exact: true })).toBeVisible();
  await expect(
    inspector.getByText('Same part · all dates and variants'),
  ).toBeVisible();
});

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
// Browser checks never request production OSM tiles; markers and the fallback list stay real.
test.beforeEach(async ({ page }) => {
  await page.route('https://tile.openstreetmap.org/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'image/png',
      body: Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
        'base64',
      ),
    }),
  );
});

test('product, facility evidence, shared part and product pivot', async ({
  page,
}, info) => {
  await page.goto('/?view=network');
  await expect(
    page.getByRole('heading', { name: 'Raspberry Pi 5', exact: true }),
  ).toBeVisible();
  await page
    .getByRole('button', {
      name: /Sony → Pi 5 board assembly Sony UK Technology Centre/,
    })
    .click();
  const dialog = page.getByRole('dialog');
  await expect(
    dialog.getByText('Designed in Cambridge, manufactured in Wales'),
  ).toBeVisible();
  await expect(
    dialog.getByRole('link', { name: /Introducing: Raspberry Pi 5/ }),
  ).toHaveAttribute(
    'href',
    'https://www.raspberrypi.com/news/introducing-raspberry-pi-5/',
  );
  await dialog
    .getByRole('button', { name: 'Sony UK Technology Centre', exact: true })
    .click();
  await expect(dialog.getByText(/Town-level placement/)).toBeVisible();
  await dialog.getByRole('button', { name: 'Close', exact: true }).click();
  await page
    .getByRole('button', { name: 'RP1 Specific part', exact: true })
    .click();
  await dialog
    .getByRole('button', { name: 'Raspberry Pi 500', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Raspberry Pi 500', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: /Sony UK Technology Centre Board/ }),
  ).toHaveCount(0);
  await page.getByRole('tab', { name: 'Components', exact: true }).click();
  await expect(page.getByRole('table')).toContainText('RP1');
  await page.reload();
  await expect(
    page.getByRole('tab', { name: 'Components', exact: true }),
  ).toHaveAttribute('aria-selected', 'true');
  await page.screenshot({
    path: `docs/screenshots/${info.project.name}-components.png`,
    fullPage: true,
  });
});
test('filters, empty results, comparison and scenario explain uncertainty', async ({
  page,
}) => {
  await page.goto('/?product=pi5&view=breakdown&role=packager');
  await expect(page.getByText('No matching records')).toBeVisible();
  await page
    .getByRole('button', { name: 'Reset filters', exact: true })
    .click();
  await expect(page.getByRole('table')).toContainText('DA9091');
  await page.goto('/?product=pi5&view=compare&other=pi500');
  await expect(page.getByText('Parts: BCM2712, RP1')).toBeVisible();
  await page.goto('/?view=risk&target=tsmc');
  await expect(
    page.getByText('potentially connected products', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Raspberry Pi Pico', exact: true }),
  ).toBeVisible();
  await expect(
    page.locator('.scenario-product').getByText('Inferred', { exact: true }),
  ).toHaveCount(5);
});
test('search, map selection and administrative lock', async ({ page }) => {
  await page.goto('/?view=network');
  await page
    .getByRole('textbox', { name: 'Search all entities' })
    .fill('Taiwan Semiconductor');
  await page.getByRole('button', { name: 'TSMC company' }).click();
  await expect(
    page
      .getByRole('dialog')
      .getByRole('heading', { name: 'TSMC', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Close', exact: true }).click();
  await page.getByRole('tab', { name: 'Factory map', exact: true }).click();
  await page
    .getByRole('button', {
      name: /Sony UK Technology Centre approximate location/,
    })
    .click();
  await expect(
    page.getByRole('dialog').getByText(/not a surveyed factory coordinate/),
  ).toBeVisible();
  await page.goto('/?view=admin');
  await expect(
    page.getByRole('heading', { name: 'Protected research administration' }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Save reviewed correction' }),
  ).toHaveCount(0);
});
test('keyboard, responsive overflow and accessibility', async ({
  page,
}, info) => {
  await page.goto('/?view=network');
  const skipLink = page.getByRole('link', { name: 'Skip to workspace' });
  await expect(skipLink).toHaveCSS('opacity', '0');
  await page.keyboard.press('Tab');
  await expect(skipLink).toBeFocused();
  await expect(skipLink).toHaveCSS('opacity', '1');
  await expect(skipLink).toBeInViewport();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#workspace$/);
  await expect(skipLink).toHaveCSS('opacity', '0');
  await page
    .getByRole('heading', { name: 'A connected view of your product' })
    .waitFor();
  await expect(
    page.getByRole('button', { name: 'BCM2712 Specific part' }),
  ).toBeVisible();
  const violations = (
    await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze()
  ).violations;
  expect(
    violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
  ).toEqual([]);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > innerWidth + 1,
  );
  expect(overflow).toBe(false);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: `docs/screenshots/${info.project.name}-network.png`,
    fullPage: true,
  });
  await page.getByRole('button', { name: 'BCM2712 Specific part' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('product studio decomposes parts, explains illustration and shares evidence', async ({
  page,
}, info) => {
  await page.goto('/');
  await expect(
    page.getByRole('tab', { name: 'Product studio', exact: true }),
  ).toHaveAttribute('aria-selected', 'true');
  await expect(
    page.getByRole('heading', { name: 'Every part has a story.' }),
  ).toBeVisible();
  await expect(
    page.getByText(/AI-generated product illustration/),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Explode components', exact: true })
    .click();
  await expect(
    page.getByRole('slider', { name: 'Layer separation' }),
  ).toHaveValue('85');
  await page.getByRole('button', { name: 'Inspect RP1', exact: true }).click();
  const inspector = page.getByRole('complementary', {
    name: 'Selected component sourcing',
  });
  await expect(
    inspector.getByText(/Manufacturing facility not identified/),
  ).toBeVisible();
  await inspector.getByRole('button', { name: /TSMC fabricator/ }).click();
  await expect(
    page.getByRole('dialog').getByText(/Part-level evidence/),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Close', exact: true }).click();
  await page
    .getByRole('button', { name: 'Rotate product', exact: true })
    .click();
  const violations = (
    await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze()
  ).violations;
  expect(
    violations.map((v) => ({
      id: v.id,
      targets: v.nodes.map((n) => n.target),
    })),
  ).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth + 1,
    ),
  ).toBe(false);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: `docs/screenshots/${info.project.name}-studio.png`,
    fullPage: true,
  });
  await inspector
    .getByRole('button', { name: 'Raspberry Pi 500', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Raspberry Pi 500', exact: true }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Reset product view', exact: true })
    .click();
  await expect(
    page.getByRole('slider', { name: 'Layer separation' }),
  ).toHaveValue('0');
});

test('supplier comparison, geographic coverage and concentration stay traceable', async ({
  page,
}) => {
  await page.goto('/?view=compare&left=raspberry-pi&other=broadcom');
  await expect(
    page.getByText('Upstream suppliers for the same parts'),
  ).toHaveCount(2);
  await expect(page.getByText('Supporting publications')).toHaveCount(2);
  await expect(
    page.getByText(/does not infer a commercial purchase/),
  ).toBeVisible();
  await page.goto('/?view=risk&target=tsmc');
  await expect(
    page.getByRole('heading', { name: 'Shared upstream dependencies' }),
  ).toBeVisible();
  await expect(page.getByText(/Geography is unknown for/)).toBeVisible();
  await page
    .getByText('Observed supplier concentration by part and role', {
      exact: true,
    })
    .click();
  await expect(
    page.getByText(/A count of one is one known supplier/),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Inspect supporting claim' })
    .first()
    .click();
  await expect(
    page.getByRole('dialog').getByText('Supporting source', { exact: true }),
  ).toBeVisible();
});

test('review desk requires reasons and sends reviewed snapshot decisions', async ({
  page,
}) => {
  const token = 'browser-test-token-kept-in-memory-only';
  const source = {
    id: 'licensed-test',
    title: 'Licensed review document',
    url: 'https://example.org/document',
    publisher: 'Test publisher',
    license: 'CC BY-SA 4.0',
    terms_url: 'https://example.org/license',
    reuse: 'Fixture content for interface testing',
  };
  const snapshot = {
    id: 11,
    source_id: source.id,
    digest: 'fixture-digest',
    status: 'pending',
    retrieved_at: '2026-09-10',
    reviewed_at: null,
    review_reason: null,
    affected_claim_ids: [],
    fetch_url: 'https://example.org/document',
  };
  const requests: { url: string; body: unknown }[] = [];
  await page.route('**/api/admin/**', async (route) => {
    const request = route.request();
    expect(request.headers().authorization).toBe('Bearer ' + token);
    if (request.method() === 'POST')
      requests.push({ url: request.url(), body: request.postDataJSON() });
    const payload = request.url().endsWith('/status')
      ? {
          runs: [],
          revisions: [],
          sources: [],
          review_queue: [],
          snapshots: [snapshot],
        }
      : request.url().endsWith('/snapshots/11')
        ? { ...snapshot, source, body: 'Retained licensed document fixture.' }
        : request.url().endsWith('/import')
          ? { changed: 0, cached: true }
          : { id: 11, status: 'acknowledged' };
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(payload),
    });
  });
  await page.goto('/?view=admin');
  await page.getByLabel('Administrator token', { exact: true }).fill(token);
  await page.getByRole('button', { name: 'Unlock administration' }).click();
  await page.getByRole('button', { name: /licensed-test/ }).click();
  await expect(page.getByLabel('Retained licensed source text')).toContainText(
    'Retained licensed document fixture.',
  );
  await page
    .getByLabel('Source review reason', { exact: true })
    .fill('Reviewed document; no unsupported allocation added.');
  await page.getByRole('button', { name: 'Acknowledge review' }).click();
  expect(requests[0].body).toEqual({
    digest: 'fixture-digest',
    decision: 'acknowledged',
    reason: 'Reviewed document; no unsupported allocation added.',
  });
  await page
    .getByLabel('Reviewed collection JSON', { exact: true })
    .fill(JSON.stringify({ entities: [], sources: [], claims: [] }));
  await page
    .getByLabel('Reason for reviewed import', { exact: true })
    .fill('Reviewed fixture import for interface validation.');
  await page
    .getByRole('button', { name: 'Import reviewed collection', exact: true })
    .click();
  await expect(page.getByText('0 records imported.')).toBeVisible();
  expect(requests[1].body).toEqual({
    bundle: { entities: [], sources: [], claims: [] },
    reason: 'Reviewed fixture import for interface validation.',
  });
  await page.getByRole('button', { name: 'Lock administration' }).click();
  await expect(
    page.getByLabel('Administrator token', { exact: true }),
  ).toHaveValue('');
  await expect(
    page.getByRole('button', { name: 'Save reviewed correction' }),
  ).toHaveCount(0);
});

test('locking administration invalidates an in-flight source check', async ({
  page,
}) => {
  let release!: () => void;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  let refreshWaiting = false;
  await page.route('**/api/admin/**', async (route) => {
    if (route.request().url().endsWith('/refresh')) {
      refreshWaiting = true;
      await pending;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'Check completed', results: [] }),
      });
    } else {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          runs: [],
          revisions: [],
          sources: [],
          review_queue: [],
          snapshots: [],
        }),
      });
    }
  });
  await page.goto('/?view=admin');
  await page
    .getByLabel('Administrator token', { exact: true })
    .fill('pending-request-fixture-token-of-sufficient-length');
  await page.getByRole('button', { name: 'Unlock administration' }).click();
  await page
    .getByRole('button', { name: 'Check licensed documentation' })
    .click();
  await expect.poll(() => refreshWaiting).toBe(true);
  await page.getByRole('button', { name: 'Lock administration' }).click();
  const completed = page.waitForResponse('**/api/admin/refresh');
  release();
  await (await completed).finished();
  await page.keyboard.press('Tab');
  await expect(
    page.getByRole('heading', { name: 'Protected research administration' }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Save reviewed correction' }),
  ).toHaveCount(0);
  await expect(
    page.getByLabel('Administrator token', { exact: true }),
  ).toHaveValue('');
  await expect(page.getByText('Check completed', { exact: true })).toHaveCount(
    0,
  );
});

test('uncategorized parts remain browsable and material evidence links the material', async ({
  page,
  request,
}) => {
  const atlas = await (await request.get('/api/atlas')).json();
  atlas.entities.find((e: { id: string }) => e.id === 'rp1').category_id = null;
  await page.route('**/api/atlas', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(atlas),
    }),
  );
  await page.goto('/?view=breakdown&product=pi5');
  await expect(
    page.getByRole('button', { name: 'Uncategorized parts', exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('table')).toContainText('RP1');
  const materialClaim = atlas.claims.find(
    (c: { material_id: string }) => c.material_id === 'aluminium',
  );
  await page.goto('/?product=mac-pro-2019&claim=' + materialClaim.id);
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Aluminium', exact: true })
    .click();
  await expect(
    page
      .getByRole('dialog')
      .getByRole('heading', { name: 'Aluminium', exact: true }),
  ).toBeVisible();
  await expect(
    page
      .getByRole('dialog')
      .getByRole('button', { name: 'Apple Mac Pro (2019)', exact: true }),
  ).toBeVisible();
});

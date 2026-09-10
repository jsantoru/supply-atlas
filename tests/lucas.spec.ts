import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('LUCAS exterior really separates, selects cited topics and resets', async ({
  page,
}, info) => {
  await page.goto('/?product=lucas&view=teardown');
  const studio = page.getByRole('region', {
    name: 'LUCAS interactive systems illustration',
  });
  const inspector = page.getByRole('complementary', {
    name: 'Selected major system',
  });
  await expect(studio.getByRole('img')).toBeVisible();
  await studio.screenshot({
    path: `docs/screenshots/${info.project.name}-lucas-exterior.png`,
    animations: 'disabled',
  });
  await studio
    .getByRole('button', { name: 'Interactive diagram', exact: true })
    .click();
  const wing = studio.locator('.lucas-left-wing');
  const assembled = await wing.boundingBox();
  await studio
    .getByRole('button', { name: 'Explode exterior', exact: true })
    .click();
  const slider = studio.getByRole('slider', { name: 'Exterior separation' });
  await expect(slider).toHaveValue('85');
  await expect
    .poll(async () => (await wing.boundingBox())!.x)
    .toBeLessThan(assembled!.x - 8);
  await studio
    .getByRole('button', {
      name: 'Inspect Weapons and payload role',
      exact: true,
    })
    .click();
  await expect(
    inspector.getByRole('heading', { name: 'Weapons and payload role' }),
  ).toBeVisible();
  await expect(inspector).toContainText('inert payloads');
  await expect(inspector.getByRole('link').first()).toHaveAttribute(
    'href',
    /dvidshub\.net\/news\/552807/,
  );
  await slider.focus();
  await page.keyboard.press('End');
  await expect(slider).toHaveValue('100');
  const beforeRotation = await studio
    .locator('.lucas-drawing-plane')
    .evaluate((element) => getComputedStyle(element).transform);
  await studio
    .getByRole('button', { name: 'Rotate product', exact: true })
    .click();
  await expect(studio.locator('.lucas-drawing-plane')).not.toHaveCSS(
    'transform',
    beforeRotation,
  );
  await studio
    .getByRole('button', { name: 'Toggle angled view', exact: true })
    .click();
  await expect(
    studio.getByRole('button', { name: 'Toggle angled view' }),
  ).toHaveAttribute('aria-pressed', 'true');
  await expect(
    page
      .getByRole('region', { name: 'Sources and access notes' })
      .locator(':scope > ol > li'),
  ).toHaveCount(14);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await page
    .locator('.research-studio-grid')
    .screenshot({
      path: `docs/screenshots/${info.project.name}-lucas-exploded.png`,
      animations: 'disabled',
    });
  await studio
    .getByRole('button', { name: 'Reset product view', exact: true })
    .click();
  await expect(slider).toHaveValue('0');
  await expect(studio.getByRole('img')).toBeVisible();
  await expect(
    inspector.getByRole('heading', { name: 'External airframe' }),
  ).toBeVisible();
  await inspector
    .getByRole('button', { name: '02 Propulsion exterior' })
    .click();
  await expect(
    studio.getByRole('button', { name: 'Interactive diagram', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await expect(studio.locator('.lucas-visible-propulsion')).toHaveClass(
    /is-active/,
  );
  await page.getByRole('tab', { name: 'Major systems' }).click();
  await expect(page).toHaveURL(/view=breakdown/);
  await expect(
    studio.getByRole('button', { name: 'Explode exterior' }),
  ).toBeVisible();
});

test('LUCAS network distinguishes manufacturing from program relationships', async ({
  page,
  request,
}, info) => {
  await page.goto('/?product=lucas&view=network');
  const network = page.getByRole('region', {
    name: 'Cited industrial and program network',
  });
  const relations = network.getByRole('group', { name: 'Cited relationships' });
  const evidence = network.getByRole('complementary', {
    name: 'Selected relationship evidence',
  });
  await expect(relations.getByRole('button')).toHaveCount(6);
  await expect(
    evidence.getByRole('heading', { name: 'Attributed manufacturer' }),
  ).toBeVisible();
  await expect(evidence.getByRole('link').first()).toHaveAttribute(
    'href',
    /channelnewsasia\.com/,
  );
  await network
    .getByLabel('Show relationships', { exact: true })
    .selectOption('task-force-59');
  await expect(relations.getByRole('button')).toHaveCount(1);
  await expect(evidence).toContainText('demonstration');
  await expect(evidence.getByRole('link').first()).toHaveAttribute(
    'href',
    /navy\.mil/,
  );
  await network.getByRole('button', { name: 'Show all', exact: true }).click();
  await expect(relations.getByRole('button')).toHaveCount(6);
  const node = network.getByRole('button', {
    name: 'Show relationships for Yuma Proving Ground',
    exact: true,
  });
  await node.focus();
  await page.keyboard.press('Enter');
  await expect(relations.getByRole('button')).toHaveCount(1);
  await expect(
    evidence.getByRole('heading', { name: 'Hosted evaluation' }),
  ).toBeVisible();
  await network.getByRole('button', { name: 'Show all', exact: true }).click();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await network.screenshot({
    path: `docs/screenshots/${info.project.name}-lucas-network.png`,
    animations: 'disabled',
  });
  const supply = await (await request.get('/api/graph/lucas?depth=3')).json();
  expect(supply.nodes.map((item: { id: string }) => item.id).sort()).toEqual([
    'lucas',
    'spektreworks',
  ]);
  expect(supply.claims).toHaveLength(2);
  await page.goto('/?product=lucas&view=network&role=fabricator&at=2000-01-01');
  await expect(
    network
      .getByRole('group', { name: 'Cited relationships' })
      .getByRole('button'),
  ).toHaveCount(6);
  const filtered = await (
    await request.get('/api/graph/lucas?role=fabricator&at=2000-01-01')
  ).json();
  expect(filtered.claims).toHaveLength(0);
});

test('program research survives an independent supplier graph failure and retries its own request', async ({
  page,
}) => {
  await page.route('**/api/graph/lucas?*', (route) =>
    route.fulfill({
      status: 503,
      json: { detail: 'Supply graph temporarily unavailable' },
    }),
  );
  let fail = true;
  await page.route('**/api/research/lucas', (route) =>
    fail
      ? route.fulfill({
          status: 503,
          json: { detail: 'Program record temporarily unavailable' },
        })
      : route.continue(),
  );
  await page.goto('/?product=lucas&view=network');
  await expect(
    page.getByText('Program record temporarily unavailable', { exact: true }),
  ).toBeVisible();
  fail = false;
  const errorPanel = page
    .getByText('Program record temporarily unavailable', { exact: true })
    .locator('..');
  await errorPanel.getByRole('button', { name: 'Try again' }).click();
  await expect(
    page.getByRole('region', { name: 'Cited industrial and program network' }),
  ).toBeVisible();
  await expect(
    page.getByText('Supply graph temporarily unavailable', { exact: true }),
  ).toBeVisible();
});

test('LUCAS retains interactive sections and citations if its exterior image is unavailable', async ({
  page,
}) => {
  await page.route('**/products/lucas.png', (route) => route.abort());
  await page.goto('/?product=lucas&view=teardown');
  const studio = page.getByRole('region', {
    name: 'LUCAS interactive systems illustration',
  });
  await expect(
    studio.getByText('Exterior illustration unavailable.', { exact: false }),
  ).toBeVisible();
  await expect(
    studio.getByRole('button', { name: 'Exterior illustration', exact: true }),
  ).toBeDisabled();
  await studio
    .getByRole('button', { name: 'Explode exterior', exact: true })
    .click();
  await expect(
    studio.getByRole('slider', { name: 'Exterior separation' }),
  ).toHaveValue('85');
  await studio
    .getByRole('button', { name: 'Inspect Guidance and control', exact: true })
    .click();
  const inspector = page.getByRole('complementary', {
    name: 'Selected major system',
  });
  await expect(
    inspector.getByRole('heading', { name: 'Guidance and control' }),
  ).toBeVisible();
  await expect(inspector.getByRole('link')).toHaveCount(2);
  await studio.getByRole('button', { name: 'Reset product view' }).click();
  await expect(
    studio.getByRole('button', { name: 'Interactive diagram', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
});

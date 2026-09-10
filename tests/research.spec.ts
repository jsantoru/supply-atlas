import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

for (const product of [
  {
    id: 'mohajer6',
    name: 'Mohajer-6',
    system: 'Observation equipment',
    count: 5,
  },
  {
    id: 'shahed238',
    name: 'Shahed-238',
    system: 'Displayed configuration options',
    count: 4,
  },
]) {
  test(`${product.name} has cited systems, research navigation and an accessible studio`, async ({
    page,
  }, info) => {
    await page.goto(`/?product=${product.id}&view=teardown`);
    await expect(
      page.getByRole('heading', { name: product.name, exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole('navigation', { name: 'Breadcrumb' }),
    ).toContainText('Aviation');
    const inspector = page.getByRole('complementary', {
      name: 'Selected major system',
    });
    const selections = inspector.getByRole('button');
    await expect(selections).toHaveCount(product.count);
    await inspector.getByRole('button', { name: product.system }).click();
    await expect(
      inspector.getByRole('heading', { name: product.system }),
    ).toBeVisible();
    await expect(inspector.getByRole('link').first()).toHaveAttribute(
      'href',
      /^https:\/\//,
    );
    await page
      .getByRole('button', { name: 'Separate system cards', exact: true })
      .click();
    await expect(
      page.getByRole('slider', { name: 'System card separation' }),
    ).toHaveValue('85');
    await page.getByRole('button', { name: 'Rotate product' }).click();
    await page.getByRole('button', { name: 'Toggle angled view' }).click();
    await expect(
      page.getByRole('button', { name: 'Toggle angled view' }),
    ).toHaveAttribute('aria-pressed', 'true');
    await page.getByRole('slider', { name: 'System card separation' }).focus();
    await page.keyboard.press('ArrowLeft');
    await expect(
      page.getByRole('slider', { name: 'System card separation' }),
    ).toHaveValue('84');
    const cards = await page
      .locator('.research-system-labels button')
      .evaluateAll((buttons) =>
        buttons.map((button) => {
          const rect = button.getBoundingClientRect();
          return {
            x: rect.x,
            y: rect.y,
            right: rect.right,
            bottom: rect.bottom,
          };
        }),
      );
    for (let i = 0; i < cards.length; i++) {
      for (let j = i + 1; j < cards.length; j++) {
        expect(
          cards[i].right <= cards[j].x ||
            cards[j].right <= cards[i].x ||
            cards[i].bottom <= cards[j].y ||
            cards[j].bottom <= cards[i].y,
        ).toBeTruthy();
      }
    }
    await expect(
      page
        .getByRole('navigation', { name: 'Research dossier sections' })
        .getByRole('link'),
    ).toHaveCount(6);
    await expect(
      page.getByRole('heading', { name: 'People in the public record' }),
    ).toBeAttached();
    await expect(
      page.getByRole('heading', {
        name: 'Manufacturing and location evidence',
      }),
    ).toBeAttached();
    const sources = page.getByRole('region', {
      name: 'Sources and access notes',
    });
    await expect(sources.locator(':scope > ol > li')).toHaveCount(10);
    await sources.locator('summary').first().click();
    await expect(sources.locator('details').first()).toHaveAttribute(
      'open',
      '',
    );
    await expect(
      page.getByText('Dossier covers all cited dates.', { exact: false }),
    ).toBeVisible();
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBeTruthy();
    const headingBox = await page
      .getByRole('heading', { name: 'Explore the aircraft.' })
      .boundingBox();
    const controlsBox = await page
      .getByRole('button', { name: 'Toggle angled view' })
      .boundingBox();
    expect(
      headingBox &&
        controlsBox &&
        (controlsBox.x >= headingBox.x + headingBox.width ||
          controlsBox.y >= headingBox.y + headingBox.height ||
          controlsBox.y + controlsBox.height <= headingBox.y),
    ).toBeTruthy();
    await page.locator('.research-studio-grid').screenshot({
      path: `docs/screenshots/${info.project.name}-${product.id}-studio.png`,
      animations: 'disabled',
    });
    await page.getByRole('button', { name: 'Reset product view' }).click();
    await expect(
      page.getByRole('slider', { name: 'System card separation' }),
    ).toHaveValue('0');
    await page.getByRole('tab', { name: 'Major systems' }).click();
    await expect(page).toHaveURL(/view=breakdown/);
    await expect(
      page.getByRole('complementary', { name: 'Selected major system' }),
    ).toBeVisible();
  });
}

test('research remains dated context while workspace filters restrict manufacturing attributions', async ({
  page,
}) => {
  await page.goto('/?product=shahed238&view=teardown&status=direct');
  const attributions = page.getByRole('region', {
    name: 'Filtered manufacturing attributions',
  });
  await expect(attributions).toContainText(
    'No manufacturing attributions match',
  );
  await expect(
    page.getByRole('heading', {
      name: 'A Tehran exhibition venue is not a factory',
    }),
  ).toBeAttached();
  await page
    .getByRole('button', { name: 'Explore Mohajer-6', exact: true })
    .click();
  await expect(page).toHaveURL(/product=mohajer6/);
  await expect(attributions.getByRole('button')).toHaveCount(2);
  await page
    .getByRole('region', {
      name: 'Organizations and institutional relationships',
    })
    .getByRole('button', { name: 'Open organization profile' })
    .click();
  await expect(page).toHaveURL(/entity=qods-aviation/);
});

test('research failures retry and illustration failure retains cited systems', async ({
  page,
}) => {
  let fail = true;
  await page.route('**/api/research/mohajer6', (route) =>
    fail
      ? route.fulfill({
          status: 503,
          contentType: 'application/json',
          body: JSON.stringify({ detail: 'Research temporarily unavailable' }),
        })
      : route.continue(),
  );
  await page.route('**/products/mohajer6.png', (route) => route.abort());
  await page.goto('/?product=mohajer6&view=teardown');
  await expect(
    page.getByText('Research temporarily unavailable'),
  ).toBeVisible();
  fail = false;
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(
    page.getByText('Exterior illustration unavailable.', { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByRole('complementary', { name: 'Selected major system' }),
  ).toContainText('Airframe and wings');
});

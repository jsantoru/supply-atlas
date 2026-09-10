import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('product, facility evidence, shared part and product pivot', async ({
  page,
}, info) => {
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'Raspberry Pi 5', exact: true }),
  ).toBeVisible();
  await page
    .getByRole('button', {
      name: 'Sony → Pi 5 board Pencoed, Wales · Assembly',
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
  await expect(page.getByText('Inferred', { exact: true })).toHaveCount(3);
});
test('search, map selection and administrative lock', async ({ page }) => {
  await page.goto('/');
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
  await page.goto('/');
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

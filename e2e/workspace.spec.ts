import { expect, test } from '@playwright/test';

test('paste data, render chart and open export dialog', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('表格转图表')).toBeVisible();
  await page.getByRole('button', { name: '粘贴' }).click();
  const input = page.getByPlaceholder('从 Excel、WPS 或 Numbers 粘贴数据');
  await input.fill('月份\t销售额\n1月\t120\n2月\t180\n3月\t150');
  await page.getByRole('button', { name: '识别并更新' }).click();
  await expect(page.getByText('3 行 × 2 列')).toBeVisible();
  await expect(page.locator('canvas')).toBeVisible();
  await page.getByRole('button', { name: '导出' }).click();
  await expect(page.getByRole('heading', { name: '导出图表' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'PPT 16:9' })).toBeVisible();
});

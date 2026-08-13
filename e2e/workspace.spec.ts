import { expect, test } from '@playwright/test';

test('medium tables render every row without accidental virtualization', async ({ page }) => {
  await page.goto('/');
  if ((page.viewportSize()?.width ?? 1000) <= 680) await page.getByRole('button', { name: '数据', exact: true }).click();
  await page.getByRole('button', { name: '粘贴' }).click();
  const rows=Array.from({length:50},(_,index)=>`项目 ${index+1}\t${index+1}`);
  await page.getByPlaceholder('从 Excel、WPS 或 Numbers 粘贴数据').fill(['项目\t数值',...rows].join('\n'));
  await page.getByRole('button', { name: '识别并更新' }).click();
  await expect(page.locator('.workspace-table tbody tr:not(.virtual-spacer)')).toHaveCount(50);
  await expect(page.getByText(/已启用虚拟渲染/)).toHaveCount(0);
});

test('paste data, render chart and open export dialog', async ({ page }) => {
  await page.goto('/');
  if ((page.viewportSize()?.width ?? 1000) <= 680) {
    await expect(page.getByRole('navigation', { name: '移动工作区' })).toBeVisible();
    await expect(page.locator('.brand-mark')).toBeVisible();
    await page.getByRole('button', { name: '数据', exact: true }).click();
  } else {
    await expect(page.getByText('表格转图表')).toBeVisible();
  }
  await page.getByRole('button', { name: '粘贴' }).click();
  const input = page.getByPlaceholder('从 Excel、WPS 或 Numbers 粘贴数据');
  await input.fill('月份\t销售额\n1月\t120\n2月\t180\n3月\t150');
  await page.getByRole('button', { name: '识别并更新' }).click();
  const mobile = (page.viewportSize()?.width ?? 1000) <= 680;
  if (mobile) {
    await expect(page.locator('.workspace-table tbody tr')).toHaveCount(3);
    await page.getByRole('button', { name: '图表', exact: true }).click();
  } else {
    await expect(page.getByText('3 行 × 2 列')).toBeVisible();
  }
  await expect(page.locator('canvas')).toBeVisible();
  await page.getByRole('button', { name: '导出' }).click();
  await expect(page.getByRole('heading', { name: '导出图表' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'PPT 16:9' })).toBeVisible();
});

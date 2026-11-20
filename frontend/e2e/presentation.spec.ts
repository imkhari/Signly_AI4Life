import { expect, test, type Page } from '@playwright/test';
import path from 'node:path';

const output = path.resolve('../artifacts/ai4life/screenshots');
async function capture(page: Page, name: string) {
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: path.join(output, `${name}.png`), fullPage: true });
  const original = page.viewportSize()!;
  for (const width of [1280,1024,720,390]) { await page.setViewportSize({width,height:800}); await fits(page); }
  await page.setViewportSize(original);
}
async function fits(page: Page) {
  const overflow = await page.evaluate(() => Array.from(document.querySelectorAll('body *')).filter(el => el.getBoundingClientRect().right > innerWidth + 1).slice(0,8).map(el => ({tag:el.tagName,cls:el.className,text:el.textContent?.slice(0,80)})));
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), JSON.stringify({url:page.url(),width:page.viewportSize()?.width,overflow})).toBe(true);
}

test('presentation evidence uses the working intake flow and remains usable at four widths', async ({ context }) => {
  const home = await context.newPage();
  await home.setViewportSize({ width: 1280, height: 800 });
  await home.goto('/'); await capture(home, 'home');
  await expect(home.getByText('Bảng mẫu thành phần (Kitchen Sink)')).toHaveCount(0);
  const nurse = await context.newPage(); const patient = await context.newPage();
  for (const page of [nurse, patient]) await page.setViewportSize({ width: 1280, height: 800 });
  await nurse.goto('/nurse'); await patient.goto('/patient');
  await expect(nurse.getByTestId('nurse-pairing-code')).toHaveText(/^[A-Z0-9]{6}$/);
  await capture(patient, 'patient-pairing'); await capture(nurse, 'nurse-empty');
  const code = (await nurse.getByTestId('nurse-pairing-code').innerText()).trim();
  await patient.keyboard.type(code); await patient.keyboard.press('Enter');
  await expect(patient.getByText('Đã kết nối', { exact: true })).toBeVisible();
  await capture(patient, 'patient-mode');
  await patient.getByRole('button', {name:'Chữ lớn',exact:true}).click();
  await patient.getByRole('button', {name:'Tương phản cao',exact:true}).click();
  await capture(patient,'patient-accessible');
  const contrast = await patient.getByRole('button',{name:'Tiếp tục',exact:true}).evaluate(el => ({color:getComputedStyle(el).color,background:getComputedStyle(el).backgroundColor}));
  expect(contrast).toEqual({color:'rgb(0, 0, 0)',background:'rgb(255, 255, 255)'});
  await patient.getByRole('button',{name:'Tương phản chuẩn',exact:true}).click();
  await patient.getByRole('button',{name:'Chữ chuẩn',exact:true}).click();
  const next = () => patient.getByRole('button', { name: 'Tiếp tục', exact: true }).click();
  await next();
  await patient.getByRole('button', { name: 'Đau / Nhức', exact: true }).click();
  await capture(patient, 'patient-symptoms');
  await patient.getByRole('tab', { name: 'Vị trí đau', exact: true }).click();
  await patient.getByRole('button', { name: 'Đầu', exact: true }).click();
  await capture(patient, 'patient-body');
  await patient.getByRole('img', {name:/Sơ đồ cơ thể người/}).locator('../..').screenshot({path:path.join(output,'patient-body-focus.png')});
  await patient.getByRole('tab', { name: 'Mức đau', exact: true }).click();
  await patient.getByRole('slider').fill('6');
  await capture(patient, 'patient-pain');
  await patient.getByRole('tab', { name: 'Bắt đầu từ khi nào?', exact: true }).click();
  await patient.getByRole('button', { name: '2 giờ', exact: true }).click();
  await capture(patient, 'patient-onset');
  await next(); await capture(patient, 'patient-allergy');
  await patient.getByRole('button', { name: 'Không chắc chắn', exact: true }).click(); await next();
  await expect(patient.getByText('Chưa rõ tiền sử dị ứng', { exact: true })).toBeVisible();
  await capture(patient, 'patient-confirm');
  await patient.getByRole('button', { name: 'Đúng, xác nhận', exact: true }).click();
  await capture(patient, 'patient-waiting');
  await expect(nurse.getByTestId('btn-verify-intake')).toBeDisabled();
  await capture(nurse, 'nurse-alerts');
  await nurse.getByTestId('alert-item-ALLERGY_UNSURE').screenshot({path:path.join(output,'nurse-alert-focus.png')});
  await nurse.getByRole('button', { name: 'Xác nhận đã biết cảnh báo ALLERGY_UNSURE' }).click();
  await nurse.getByTestId('btn-verify-intake').click();
  await expect(patient.getByText('Số thứ tự của bạn (STT)', { exact: true })).toBeVisible();
  await capture(patient, 'patient-approved'); await capture(nurse, 'nurse-approved');
  await nurse.getByRole('button', { name: 'Xuất hồ sơ bàn giao', exact: true }).first().click();
  await expect(nurse.getByRole('dialog')).toBeVisible(); await capture(nurse, 'nurse-export');
  await nurse.keyboard.press('Escape');
  for (const width of [1280, 1024, 720, 390]) {
    for (const page of [home, nurse, patient]) { await page.setViewportSize({width,height:800}); await fits(page); }
  }
  await nurse.getByRole('button', { name: 'Kết thúc phiên', exact: true }).click();
  await capture(nurse, 'nurse-reset');
  await nurse.getByRole('button', { name: 'Xác nhận xóa & Làm mới' }).click();
  await expect(patient.getByText('Nhập mã kết nối trạm khám', {exact:true})).toBeVisible();
  for (const width of [1280,1024,720,390]) {await patient.setViewportSize({width,height:800}); await fits(patient);}
  await home.goto('/demo'); await capture(home, 'demo');
  for (const width of [1280,1024,720,390]) {await home.setViewportSize({width,height:800}); await fits(home);}
  await home.goto('/vsl-validation'); await capture(home, 'validation');
  for (const width of [1280,1024,720,390]) {await home.setViewportSize({width,height:800}); await fits(home);}
});

test('camera permission failure keeps a visible touch exit and never claims recognition', async ({ context }) => {
  const nurse = await context.newPage(); const patient = await context.newPage();
  await patient.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = async () => { throw new DOMException('Synthetic permission denial', 'NotAllowedError'); };
  });
  await nurse.goto('/nurse'); await patient.goto('/patient');
  await expect(nurse.getByTestId('nurse-pairing-code')).toHaveText(/^[A-Z0-9]{6}$/);
  const code = (await nurse.getByTestId('nurse-pairing-code').innerText()).trim();
  await patient.keyboard.type(code); await patient.keyboard.press('Enter');
  await patient.getByRole('button', {name:'Ký hiệu VSL',exact:false}).click();
  await patient.getByRole('button',{name:'Tiếp tục',exact:true}).click();
  await expect(patient.getByRole('button',{name:'Chuyển sang Chạm',exact:true})).toBeVisible();
  await expect(patient.getByText(/quyền|từ chối/i).first()).toBeVisible();
  await capture(patient,'camera-denied-simulated');
  await patient.getByRole('button',{name:'Chuyển sang Chạm',exact:true}).click();
  await expect(patient.getByRole('button',{name:'Sốt / Nóng',exact:true})).toBeVisible();
});

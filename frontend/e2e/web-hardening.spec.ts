import {expect,test,type BrowserContext} from '@playwright/test';

async function pair(context:BrowserContext){
  const nurse=await context.newPage(),patient=await context.newPage();
  await nurse.goto('/nurse');await patient.goto('/patient');
  await expect(nurse.getByTestId('nurse-pairing-code')).toHaveText(/^[A-Z0-9]{6}$/);
  const code=(await nurse.getByTestId('nurse-pairing-code').innerText()).trim();
  for(const key of code)await patient.keyboard.press(key);
  await patient.keyboard.press('Enter');
  await expect(patient.getByText('Đã kết nối',{exact:true})).toBeVisible();
  return {nurse,patient,code};
}

test('export stays locked for drafts and patient confirmation, then prints after server acceptance',async ({context})=>{
  const {nurse,patient}=await pair(context);
  const exportButton=nurse.getByRole('button',{name:'Xuất hồ sơ bàn giao'}).first();
  await expect(exportButton).toBeDisabled();
  await nurse.evaluate(()=>{Object.assign(window,{printed:0});window.print=()=>{Reflect.set(window,'printed',Number(Reflect.get(window,'printed'))+1);};});
  const next=()=>patient.getByRole('button',{name:'Tiếp tục',exact:true}).click();
  await next();await patient.getByRole('button',{name:'Sốt / Nóng',exact:true}).click();
  await next();await patient.getByRole('button',{name:'Không dị ứng',exact:true}).click();await next();
  await expect(patient.getByRole('button',{name:'Đúng, xác nhận'})).toBeEnabled();
  await expect(exportButton).toBeDisabled();
  await patient.getByRole('button',{name:'Đúng, xác nhận'}).click();
  await expect(nurse.getByTestId('btn-verify-intake')).toBeEnabled();
  await expect(exportButton).toBeDisabled();
  await nurse.getByTestId('btn-verify-intake').click();
  await expect(exportButton).toBeEnabled();await exportButton.click();
  const printable=nurse.locator('#printable-triage-record');await expect(printable).toBeVisible();
  await nurse.getByRole('button',{name:'In phiếu bàn giao'}).click();
  await expect.poll(()=>nurse.evaluate(()=>Reflect.get(window,'printed'))).toBe(1);
  await nurse.getByRole('button',{name:'In phiếu bàn giao'}).click();
  await expect.poll(()=>nurse.evaluate(()=>Reflect.get(window,'printed'))).toBe(2);
});

test('clipboard rejection keeps pairing code and visible recovery at phone width',async ({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.addInitScript(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw new Error('Denied');}}}));
  await page.goto('/nurse');
  await expect(page.getByTestId('nurse-pairing-code')).toHaveText(/^[A-Z0-9]{6}$/);
  const copy=page.getByRole('button',{name:'Sao chép mã ghép nối'});await copy.click();
  await expect(page.getByText(/Chưa sao chép được/)).toBeVisible();
  await expect(page.getByText('Đã sao chép mã ghép nối.')).toHaveCount(0);
  expect((await copy.boundingBox())!.height).toBeGreaterThanOrEqual(64);
  expect((await copy.boundingBox())!.width).toBeGreaterThanOrEqual(64);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:'test-results/web-nurse-390.png',fullPage:true});
});

test('session creation failure explains recovery without implementation details',async ({page})=>{
  await page.route('**/api/sessions',route=>route.fulfill({status:503,json:{detail:'unavailable'}}));
  await page.goto('/nurse');
  await expect(page.getByText('Chưa tạo được phiên. Kiểm tra kết nối máy chủ.')).toBeVisible();
  expect(await page.locator('body').innerText()).not.toMatch(/make demo|Backend \(:8000\)|503/);
  await page.unroute('**/api/sessions');
  await page.getByRole('button',{name:'Thử lại ngay'}).click();
  await expect(page.getByTestId('nurse-pairing-code')).toHaveText(/^[A-Z0-9]{6}$/);
});

test('idle warning remains until continue or actual expiry, then clears patient session',async ({context})=>{
  const {nurse,patient,code}=await pair(context);
  await patient.clock.install();
  await patient.getByRole('button',{name:'Tiếp tục',exact:true}).click();
  await patient.clock.fastForward(540000);
  const warning=patient.getByRole('dialog');await expect(warning).toBeVisible();
  await patient.clock.fastForward(59000);
  await expect(warning).toBeVisible();await expect(warning).toContainText('1s');
  const continueButton=warning.getByRole('button',{name:'Tôi vẫn đang làm',exact:true});await continueButton.click();
  await expect(warning).toHaveCount(0);
  await patient.clock.fastForward(540000);await expect(warning).toBeVisible();
  await patient.clock.fastForward(60000);
  await expect(patient.getByText('Nhập mã kết nối trạm khám')).toBeVisible();
  expect(await patient.evaluate(()=>sessionStorage.getItem('ai4care_session_id'))).toBeNull();
  await expect(nurse.getByTestId('nurse-pairing-code')).not.toHaveText(code);
});

test('creating a new pairing code uses confirmed session reset and clears the old patient',async ({context,request})=>{
  const {nurse,patient,code}=await pair(context);
  await patient.getByRole('button',{name:'Tiếp tục',exact:true}).click();
  await patient.getByRole('button',{name:'Sốt / Nóng',exact:true}).click();
  await expect(nurse.getByText('Sốt / Nóng',{exact:true})).toBeVisible();
  const refresh=nurse.getByRole('button',{name:'Tạo mã ghép nối mới'});
  await refresh.click();
  await expect(nurse.getByRole('dialog')).toBeVisible();
  await nurse.getByRole('button',{name:'Hủy bỏ',exact:true}).click();
  await expect(nurse.getByTestId('nurse-pairing-code')).toHaveText(code);
  await expect(nurse.getByText('Sốt / Nóng',{exact:true})).toBeVisible();
  await refresh.click();await nurse.getByRole('button',{name:'Xác nhận xóa & Làm mới'}).click();
  await expect(patient.getByText('Nhập mã kết nối trạm khám')).toBeVisible();
  await expect(nurse.getByTestId('nurse-pairing-code')).not.toHaveText(code);
  await expect(nurse.getByText('Sốt / Nóng',{exact:true})).toHaveCount(0);
  expect((await request.post('/api/sessions/join',{data:{pairing_code:code}})).status()).toBe(404);
});

test('the patient route requires patient pairing when the tab was used by a nurse',async ({page})=>{
  await page.goto('/nurse');await expect(page.getByTestId('nurse-pairing-code')).toHaveText(/^[A-Z0-9]{6}$/);
  await expect(page.getByText('Chờ màn bệnh nhân kết nối',{exact:true})).toBeVisible();
  await page.goto('/patient');
  await expect(page.getByText('Nhập mã kết nối trạm khám')).toBeVisible();
  await expect(page.getByText('Chưa ghép nối',{exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'Tiếp tục',exact:true})).toHaveCount(0);
});

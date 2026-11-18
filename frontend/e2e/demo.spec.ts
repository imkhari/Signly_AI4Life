import { expect, test, type BrowserContext, type Page } from '@playwright/test';

async function pair(context: BrowserContext) {
  const nurse = await context.newPage();
  const patient = await context.newPage();
  await nurse.goto('/nurse');
  await patient.goto('/patient');
  const code = nurse.getByTestId('nurse-pairing-code');
  await expect(code).toHaveText(/^[A-Z0-9]{6}$/);
  const pairingCode = (await code.innerText()).trim();
  for (const key of pairingCode) await patient.keyboard.press(key);
  await patient.keyboard.press('Enter');
  await expect(patient.getByText('Đã kết nối', { exact: true })).toBeVisible();
  await expect(nurse.getByText('Đã kết nối', { exact: true })).toBeVisible();
  return { nurse, patient, pairingCode };
}

const next = (page: Page) => page.getByRole('button', { name: 'Tiếp tục', exact: true });
const approve = (page: Page) => page.getByTestId('btn-verify-intake');

async function enterSymptoms(patient: Page, nurse: Page) {
  await next(patient).click();
  await nurse.evaluate(() => {
    const observer = new MutationObserver(() => {
      if (document.body.innerText.includes('Sốt / Nóng')) {
        document.body.dataset.receivedAt = String(Date.now());
        observer.disconnect();
      }
    });
    observer.observe(document.body, { subtree: true, childList: true, characterData: true });
  });
  await patient.evaluate(() => {
    document.addEventListener('click', () => {
      document.body.dataset.inputAt = String(Date.now());
    }, { once: true, capture: true });
  });
  await patient.getByRole('button', { name: 'Sốt / Nóng', exact: true }).click();
  await nurse.getByText('Sốt / Nóng', { exact: true }).waitFor();
  const start = await patient.evaluate(() => Number(document.body.dataset.inputAt));
  const received = await nurse.evaluate(() => Number(document.body.dataset.receivedAt));
  console.log(`INPUT_UPDATED localhost, click đến DOM điều dưỡng: ${received - start} ms`);
  await next(patient).click();
}

async function chooseNoAllergyAndContinue(patient: Page) {
  const allergy = await patient.getByRole('button', { name: 'Không dị ứng', exact: true }).elementHandle();
  const proceed = await next(patient).elementHandle();
  await patient.clock.install();
  await patient.clock.pauseAt(new Date(Date.now() + 100));
  await allergy!.evaluate((button) => (button as HTMLButtonElement).click());
  await proceed!.evaluate((button) => (button as HTMLButtonElement).click());
  await patient.clock.resume();
}

test('hai màn hình dùng dữ liệu mới khi bấm nhanh, sửa và xác nhận, cấp STT và reset', async ({ context, request }) => {
  const { patient, nurse, pairingCode } = await pair(context);
  await enterSymptoms(patient, nurse);
  await chooseNoAllergyAndContinue(patient);
  await expect(patient.getByText('Không có dị ứng', { exact: true })).toBeVisible();
  await expect(approve(nurse)).toBeDisabled();

  await patient.getByRole('button', { name: 'Sửa lại' }).click();
  await next(patient).click();
  await patient.getByRole('button', { name: 'Không chắc chắn', exact: true }).click();
  await next(patient).click();
  await expect(patient.getByText('Chưa rõ tiền sử dị ứng', { exact: true })).toBeVisible();

  await patient.getByRole('button', { name: 'Đúng, xác nhận' }).click();
  await expect(approve(nurse)).toBeDisabled();
  await nurse.getByRole('button', { name: 'Xác nhận đã biết cảnh báo ALLERGY_UNSURE' }).click();
  await expect(approve(nurse)).toBeEnabled();
  await approve(nurse).click();
  await expect(patient.getByText('SỐ THỨ TỰ CỦA BẠN (STT)')).toBeVisible();
  await nurse.getByRole('button', { name: 'Kết thúc phiên', exact: true }).click();
  await nurse.getByRole('button', { name: 'Xác nhận xóa & Làm mới' }).click();
  await expect(patient.getByText('Nhập mã kết nối trạm khám')).toBeVisible();
  expect(await patient.evaluate(() => sessionStorage.getItem('ai4care_session_id'))).toBeNull();
  expect((await request.post('/api/sessions/join', { data: { pairing_code: pairingCode } })).status()).toBe(404);
});

test('tab demo độc lập bị khóa, kịch bản trên phiên bệnh nhân gửi cảnh báo và dùng mẫu cố định', async ({ context }) => {
  const { patient, nurse } = await pair(context);
  const standalone = await context.newPage();
  await standalone.goto('/demo');
  await expect(standalone.getByTestId('btn-demo-scenario-allergy')).toBeDisabled();

  await patient.goto('/demo');
  await patient.getByTestId('btn-demo-scenario-allergy').click();
  await expect(patient.getByText('Điều phối đã cập nhật dữ liệu mẫu của phiên.')).toBeVisible();
  await expect(nurse.getByText('[TEXT_MENTIONS_DRUG_NOT_DECLARED]', { exact: true })).toBeVisible();
  await patient.getByTestId('btn-demo-force-fallback').click();
  await expect(patient.getByText('Điều phối đã tạo bản tóm tắt bằng mẫu cố định.')).toBeVisible();
});

test('Không chắc gửi yêu cầu hỗ trợ mô phỏng và giữ khóa duyệt', async ({ context }) => {
  const { nurse, patient } = await pair(context);
  await enterSymptoms(patient, nurse);
  await chooseNoAllergyAndContinue(patient);
  await patient.getByRole('button', { name: 'Không chắc', exact: true }).click();
  await expect(patient.getByRole('dialog').getByText('Điều phối đã nhận yêu cầu mô phỏng.')).toBeVisible();
  await expect(approve(nurse)).toBeDisabled();
});

test('màn bệnh nhân tự kết nối lại sau khi WebSocket gián đoạn', async ({ context }) => {
  const { nurse, patient } = await pair(context);
  await patient.addInitScript(() => {
    const OriginalWebSocket = window.WebSocket;
    window.WebSocket = class extends OriginalWebSocket {
      constructor(url: string | URL, protocols?: string | string[]) {
        super(url, protocols);
        if (String(url).includes('/ws/')) {
          window.addEventListener('signly-e2e-drop-websocket', () => this.close(4000), { once: true });
        }
      }
    };
  });
  await patient.reload();
  await expect(patient.getByText('Đã kết nối', { exact: true })).toBeVisible();
  await patient.evaluate(() => window.dispatchEvent(new Event('signly-e2e-drop-websocket')));
  await expect(patient.getByText(/Đang kết nối lại/)).toBeVisible();
  await expect(patient.getByText('Đã kết nối', { exact: true })).toBeVisible();
  await enterSymptoms(patient, nurse);
});


test('bố cục 1024×768 và hai cửa sổ 720px, bàn phím và chữ lớn', async ({ context }, testInfo) => {
  const { nurse, patient } = await pair(context);
  for (const width of [1024, 720]) {
    for (const [page, role] of [[patient, 'patient'], [nurse, 'nurse']] as const) {
      await page.setViewportSize({ width, height: 768 });
      await page.getByRole('button', { name: 'Chữ lớn', exact: true }).click();
      await page.keyboard.press('Tab');
      expect(await page.evaluate(() => document.activeElement?.tagName)).not.toBe('BODY');
      await page.screenshot({ path: testInfo.outputPath(`${role}-${width}-large.png`), fullPage: true });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      await page.getByRole('button', { name: 'Chữ chuẩn', exact: true }).click();
    }
  }
  await patient.setViewportSize({ width: 1024, height: 768 });
  await patient.getByRole('button', { name: 'Ký hiệu VSL', exact: false }).click();
  await next(patient).click();
  await expect(patient.getByRole('button', { name: 'Chuyển sang Chạm' })).toBeVisible();
  await patient.screenshot({ path: testInfo.outputPath('camera-1024.png'), fullPage: true });
  await patient.getByRole('button', { name: 'Chuyển sang Chạm' }).click();
  await expect(patient.getByRole('button', { name: 'Sốt / Nóng', exact: true })).toBeVisible();
});


test.describe('validator với LLM mock độc hại', () => {
  test.use({ baseURL: 'http://127.0.0.1:15174' });

  test('normal WebSocket summary request falls back when toxic output is blocked', async ({ context }) => {
    const summaries: Record<string, unknown>[] = [];
    context.on('page', page => page.on('websocket', socket => {
      if (!socket.url().includes('/ws/')) return;
      socket.on('framereceived', frame => {
        const message = JSON.parse(String(frame.payload));
        if (message.event === 'SUMMARY_READY') summaries.push(message.payload);
      });
    }));
    const { nurse, patient } = await pair(context);
    await enterSymptoms(patient, nurse);
    await chooseNoAllergyAndContinue(patient);
    await expect.poll(() => summaries.length).toBeGreaterThan(0);
    const payload = summaries[0];
    expect(payload.nl_source).toBe('fallback_template');
    expect(payload.fallback_reason).toBe('validator_blocked');
    expect(payload.validator).toMatchObject({ passed: false });
    await expect(patient.getByText('Không có dị ứng', { exact: true })).toBeVisible();
    await expect(nurse.getByText(/Mẫu cố định/).first()).toBeVisible();
  });
});

test('câu trả lời điều dưỡng cập nhật phiếu và vẫn giữ sau sửa từng thẻ', async ({ context }) => {
  const { nurse, patient } = await pair(context);
  await enterSymptoms(patient, nurse);
  await chooseNoAllergyAndContinue(patient);
  await expect(patient.getByText('Không có dị ứng', { exact: true })).toBeVisible();
  await nurse.getByTestId('btn-question-ASK_DRUG_ALLERGY').click();
  await patient.getByRole('dialog').getByRole('button', { name: 'Có', exact: true }).click();
  await expect(patient.getByRole('dialog')).toHaveCount(0);
  await expect(patient.getByText('Có dị ứng', { exact: true })).toBeVisible();
  await patient.getByRole('button', { name: 'Sửa Tiền sử dị ứng', exact: true }).click();
  await patient.getByRole('button', { name: '+ Penicillin', exact: true }).click();
  await next(patient).click();
  await expect(patient.getByText('Penicillin', { exact: true })).toBeVisible();
  await expect(nurse.getByText(/Có dị ứng \(Penicillin\)/)).toBeVisible();
  await patient.getByRole('button', { name: 'Đúng, xác nhận' }).click();
  await expect(approve(nurse)).toBeEnabled();
});

test('lý do chính, triệu chứng đi kèm và sửa thời gian giữ nhất quán', async ({ context }, testInfo) => {
  const { nurse, patient } = await pair(context);
  await next(patient).click();
  await patient.getByRole('button', { name: 'Đau / Nhức', exact: true }).click();
  await patient.getByRole('tab', { name: 'Triệu chứng đi kèm' }).click();
  await patient.getByRole('button', { name: 'Ho / Đau họng', exact: true }).click();
  await patient.getByRole('tab', { name: 'Bắt đầu từ khi nào?' }).click();
  await patient.getByRole('button', { name: '2 giờ', exact: true }).click();
  await next(patient).click();
  await chooseNoAllergyAndContinue(patient);
  await expect(patient.getByText('Ho', { exact: true })).toBeVisible();
  await expect(patient.getByText(/None\/10/)).toHaveCount(0);
  await expect(patient.getByText('Đau / Nhức', { exact: true })).toBeVisible();
  await patient.screenshot({ path: testInfo.outputPath('review-1024.png'), fullPage: true });
  await patient.setViewportSize({ width: 720, height: 768 });
  await patient.screenshot({ path: testInfo.outputPath('review-720.png'), fullPage: true });
  await patient.getByRole('button', { name: 'Sửa Bắt đầu từ khi nào?' }).click();
  await patient.getByRole('button', { name: '1 giờ', exact: true }).click();
  await next(patient).click();
  await next(patient).click();
  await expect(patient.getByText('1 giờ', { exact: true })).toBeVisible();
  await expect(patient.getByText('Ho', { exact: true })).toBeVisible();
  await expect(nurse.getByText('Ho', { exact: true })).toBeVisible();
  await patient.getByRole('button', { name: 'Đúng, xác nhận' }).click();
  await expect(approve(nurse)).toBeEnabled();
});

import {expect,test} from '@playwright/test';

async function syntheticCamera(page:import('@playwright/test').Page) {
  await page.addInitScript(() => {
    Object.defineProperty(navigator.mediaDevices,'getUserMedia',{value:async () => {
      const canvas=document.createElement('canvas');canvas.width=640;canvas.height=480;
      canvas.getContext('2d')!.fillRect(0,0,640,480);return canvas.captureStream(30);
    }});
  });
  await page.route('**/src/services/vsl/HolisticDetector.ts*',route => route.fulfill({contentType:'application/javascript',body:`
    export class HolisticDetector {
      callbacks=new Set();timer=null;
      async initialize() {}
      onResults(fn){this.callbacks.add(fn);return ()=>this.callbacks.delete(fn);}
      start(){this.timer=setInterval(()=>{
        const points=Array(411).fill(.5);points[27]=.4;points[30]=.6;
        if(window.testMissingShoulders) points.fill(0,27,33);
        const observation={frame:{timestamp_ms:performance.now(),landmarks:points},hands:[Array.from({length:21},()=>({x:.5,y:.5,z:0}))]};
        window.testObservedFrames=(window.testObservedFrames||0)+1;
        for(const fn of this.callbacks)fn(observation);
      },40);}
      close(){clearInterval(this.timer);this.callbacks.clear();}
    }`}));
}

test('guided synthetic trial uses the real capture UI, keeps reference out of request and exports no raw input',async ({page}) => {
  await syntheticCamera(page);
  let requests=0;
  await page.route('**/api/vsl/predict',async route => {
    requests++;
    const body=route.request().postDataJSON();
    expect(Object.keys(body).sort()).toEqual(['context_step','frames']);
    expect(body.frames.length).toBeGreaterThanOrEqual(24);
    expect(body.frames[0].landmarks).toHaveLength(411);
    await route.fulfill({json:{success:true,gloss:'ĐAU',label_vi:'Đau / Nhức',confidence:.95,
      model_source:'vsl_v2_learned_translation',latency_ms:25}});
  });
  await page.goto('/vsl-validation?evidence=synthetic');
  await expect(page.getByText('Đã nạp cấu hình thử. Chọn mã người và loại lượt.')).toBeVisible();
  await page.getByRole('checkbox').check();
  await page.getByLabel('Loại lượt thử').selectOption('HEAD_SYMPTOM');
  await page.getByRole('button',{name:'Bắt đầu lượt thử',exact:true}).click();
  const begin=page.getByRole('button',{name:'Bắt đầu ký',exact:true});await expect(begin).toBeEnabled();
  await begin.click();
  const start=await page.evaluate(() => (window as unknown as {testObservedFrames:number}).testObservedFrames);
  await expect.poll(() => page.evaluate(() => (window as unknown as {testObservedFrames:number}).testObservedFrames)).toBeGreaterThan(start+28);
  expect(requests).toBe(0);
  await page.getByRole('button',{name:'Xong câu',exact:true}).click();
  await expect(page.getByText(/T0001.*HEAD_SYMPTOM: ĐAU.*Khớp nhãn dự kiến/)).toBeVisible();
  await expect(begin).toBeDisabled();expect(requests).toBe(1);
  await page.getByRole('button',{name:'Nhận',exact:true}).click();
  await page.getByTestId('btn-apply-vsl-glosses').click();
  await expect(page.getByText('Đã thử thao tác Nhận/Lưu; không tạo phiếu bệnh nhân.')).toBeVisible();
  const downloadEvent=page.waitForEvent('download');
  await page.getByRole('button',{name:'Tải kết quả CSV'}).click();
  const download=await downloadEvent;await download.saveAs('test-results/vsl-validation-synthetic.csv');
  const text=await (await download.createReadStream())!.toArray();
  const csv=Buffer.concat(text).toString('utf8');
  expect(csv).toContain('synthetic');expect(csv).not.toContain('landmarks');expect(csv).not.toContain('translation');
  await page.screenshot({path:'test-results/vsl-validation-1024.png',fullPage:true});
});

test('missing shoulders reject a synthetic trial before HTTP and show a result at 720px',async ({page}) => {
  await page.setViewportSize({width:720,height:900});await syntheticCamera(page);
  let requests=0;await page.route('**/api/vsl/predict',route => {requests++;return route.abort();});
  await page.goto('/vsl-validation?evidence=synthetic');await page.getByRole('checkbox').check();
  await page.getByRole('button',{name:'Bắt đầu lượt thử',exact:true}).click();
  await expect(page.getByRole('button',{name:'Bắt đầu ký',exact:true})).toBeEnabled();
  await page.getByRole('button',{name:'Bắt đầu ký',exact:true}).click();
  await page.evaluate(() => {Object.assign(window,{testMissingShoulders:true});});
  await expect(page.getByText(/T0001.*NEG_REST: UNKNOWN/)).toBeVisible();
  expect(requests).toBe(0);
  await expect(page.getByRole('button',{name:'Lượt tiếp theo',exact:true})).toBeEnabled();
  expect(await page.evaluate(() => document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:'test-results/vsl-validation-720.png',fullPage:true});
});

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
      start(){if(this.timer!==null)return;this.timer=setInterval(()=>{
        const points=Array(411).fill(.5);points[27]=.4;points[30]=.6;
        points.fill(0,348);
        if(window.testMissingShoulders) points.fill(0,27,33);
        if(window.testMissingHands) points.fill(0,285);
        const observation={frame:{timestamp_ms:performance.now(),landmarks:points},hands:window.testMissingHands ? [] : [Array.from({length:21},()=>({x:.25,y:.5,z:0}))]};
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
    expect(body.context_step).toBe('intake');
    expect(body.frames.length).toBeGreaterThanOrEqual(24);
    expect(body.frames[0].landmarks).toHaveLength(411);
    await route.fulfill({json:{success:true,gloss:'ĐAU',label_vi:'Đau / Nhức',confidence:.95,
      intake_suggestion:{chief_complaint_code:'PAIN',pain_present:true,body_regions:['CHEST']},
      model_source:'vsl_v2_learned_translation',latency_ms:25}});
  });
  await page.goto('/vsl-validation?evidence=synthetic');
  await expect(page.getByText('Đã nạp cấu hình thử. Chọn mã người và loại lượt.')).toBeVisible();
  await page.getByRole('checkbox').check();
  await page.getByLabel('Loại lượt thử').selectOption('CHEST_LOCATION');
  await page.getByRole('button',{name:'Bắt đầu lượt thử',exact:true}).click();
  const begin=page.getByRole('button',{name:'Bắt đầu ký',exact:true});await expect(begin).toBeEnabled();
  const tracking=page.getByTestId('vsl-tracking');
  await expect(tracking).toContainText('Tay trái');await expect(tracking).not.toContainText('Tay phải');
  const geometry=await page.getByTestId('vsl-video-element').evaluate(video=>{
    const canvas=video.parentElement!.querySelector('canvas')!;
    const ctx=canvas.getContext('2d')!;
    const mirror=(el:Element)=>getComputedStyle(el).scale.startsWith('-1') ||
      new DOMMatrix(getComputedStyle(el).transform).a===-1;
    return {video:mirror(video),overlay:mirror(canvas),aligned:video.getBoundingClientRect().x===canvas.getBoundingClientRect().x &&
      video.getBoundingClientRect().width===canvas.getBoundingClientRect().width,
      wrist:ctx.getImageData(90,180,1,1).data[3],opposite:ctx.getImageData(270,180,1,1).data[3]};
  });
  expect(geometry).toEqual({video:true,overlay:true,aligned:true,wrist:255,opposite:0});
  await begin.click();
  await expect(page.getByRole('timer')).toContainText('Còn');
  await page.screenshot({path:'test-results/vsl-validation-countdown.png',fullPage:true});
  const start=await page.evaluate(() => (window as unknown as {testObservedFrames:number}).testObservedFrames);
  await expect.poll(() => page.evaluate(() => (window as unknown as {testObservedFrames:number}).testObservedFrames)).toBeGreaterThan(start+28);
  expect(requests).toBe(0);
  await page.getByRole('button',{name:'Xong câu',exact:true}).click();
  await expect(page.getByText(/T0001.*CHEST_LOCATION: PAIN\+CHEST.*Khớp nhãn dự kiến/)).toBeVisible();
  await expect(begin).toBeDisabled();expect(requests).toBe(1);
  await page.getByRole('button',{name:'Dùng thông tin này',exact:true}).click();
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
  await expect(page.getByText(/T0001.*Chưa đủ điều kiện đo/)).toBeVisible();
  await expect(page.getByRole('button',{name:'Lượt tiếp theo',exact:true})).toBeEnabled();
  expect(await page.evaluate(() => document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:'test-results/vsl-validation-720.png',fullPage:true});
});


test('tracking rejection stays at the camera and CSV has a manual copy path',async ({page}) => {
  await page.setViewportSize({width:1024,height:768});await syntheticCamera(page);
  let requests=0;await page.route('**/api/vsl/predict',route => {requests++;return route.abort();});
  await page.goto('/vsl-validation?evidence=synthetic');await page.getByRole('checkbox').check();
  await page.getByRole('button',{name:'Bắt đầu lượt thử',exact:true}).click();
  const begin=page.getByRole('button',{name:'Bắt đầu ký',exact:true});await expect(begin).toBeEnabled();
  await begin.click();const y=await page.evaluate(() => scrollY);
  await page.evaluate(() => {Object.assign(window,{testMissingHands:true});});
  const stopped=page.getByTestId('vsl-capture-stopped');
  await expect(page.getByText(/Camera vừa mất dấu cả hai bàn tay/)).toBeVisible();
  await expect(stopped).toBeInViewport();await expect(stopped).toContainText('chưa gửi nhận diện');
  expect(Math.abs(await page.evaluate(() => scrollY)-y)).toBeLessThan(100);
  expect(requests).toBe(0);
  await page.screenshot({path:'test-results/vsl-validation-gap-fixed.png'});
  await page.getByRole('link',{name:'Xem kết quả lượt vừa thử'}).click();
  await expect(page.getByText(/T0001.*NEG_REST: UNKNOWN.*Chưa đủ điều kiện đo/)).toBeInViewport();
  await page.evaluate(() => {
    Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async () => {throw new Error('Unavailable in this browser');}}});
  });
  await page.getByRole('button',{name:'Tải kết quả CSV'}).click();
  const csv=page.getByRole('textbox',{name:'Nội dung CSV để sao chép'});
  await expect(csv).toHaveValue(/tracking_gap/);await expect(csv).toHaveValue(/synthetic/);
  expect(await csv.inputValue()).not.toContain('landmarks');
  await page.getByRole('button',{name:'Sao chép CSV',exact:true}).click();
  await expect(page.getByText('Chưa sao chép tự động được. Chọn nội dung trong ô rồi dùng Sao chép.')).toBeVisible();
});

for (const hint of ['face_not_tracked','hand_motion_unclear','model_score_low','phrase_not_supported',
  'worker_unavailable','uncontrolled decoder text']) {
  test(`synthetic intake rejection retains only its controlled diagnostic in CSV: ${hint}`,async ({page})=>{
    await syntheticCamera(page);
    await page.route('**/api/vsl/predict',route=>route.fulfill({json:{success:false,
      gloss:'UNKNOWN',confidence:0,model_source:'vsl_v2_learned_translation',
      intake_suggestion:null,suggested_next_step:hint}}));
    await page.goto('/vsl-validation?evidence=synthetic');
    await page.getByRole('checkbox').check();
    await page.getByLabel('Loại lượt thử').selectOption('CHEST_LOCATION');
    await page.getByRole('button',{name:'Bắt đầu lượt thử',exact:true}).click();
    const begin=page.getByRole('button',{name:'Bắt đầu ký',exact:true});
    await expect(begin).toBeEnabled();await begin.click();
    const start=await page.evaluate(()=>Number(Reflect.get(window,'testObservedFrames')));
    await expect.poll(()=>page.evaluate(()=>Number(Reflect.get(window,'testObservedFrames'))))
      .toBeGreaterThan(start+28);
    await page.getByRole('button',{name:'Xong câu',exact:true}).click();
    await expect(page.getByText(/T0001.*CHEST_LOCATION: UNKNOWN/)).toBeVisible();
    await expect(page.getByRole('button',{name:'Dùng thông tin này'})).toHaveCount(0);
    await page.getByRole('button',{name:'Tải kết quả CSV'}).click();
    const csv=await page.getByRole('textbox',{name:'Nội dung CSV để sao chép'}).inputValue();
    const [header,line]=csv.trim().split('\n');
    const keys=header.split(',');
    const cells=line.split(',').map(value=>value.replace(/^"|"$/g,''));
    const row=Object.fromEntries(keys.map((key,i)=>[key,cells[i]]));
    const detailed=['face_not_tracked','hand_motion_unclear','model_score_low','phrase_not_supported'].includes(hint);
    expect(row.diagnostic_code).toBe(detailed ? hint : '');
    expect(row.reason).toBe(hint==='worker_unavailable' ? hint : 'unknown');
    expect(row.outcome).toBe(hint==='worker_unavailable' ? 'unmeasurable' : 'rejected');
    expect(row.evidence_kind).toBe('synthetic');
    expect(csv).not.toContain('uncontrolled decoder text');
    expect(csv).not.toContain('landmarks');
    expect(csv).not.toContain('translation');
  });
}


test('synthetic missing-face negative is unmeasurable in the exported CSV',async ({page})=>{
  await syntheticCamera(page);
  await page.route('**/api/vsl/predict',route=>route.fulfill({json:{success:false,
    gloss:'UNKNOWN',confidence:0,model_source:'vsl_v2_learned_translation',
    intake_suggestion:null,suggested_next_step:'face_not_tracked'}}));
  await page.goto('/vsl-validation?evidence=synthetic');
  await page.getByRole('checkbox').check();
  await page.getByRole('button',{name:'Bắt đầu lượt thử',exact:true}).click();
  const begin=page.getByRole('button',{name:'Bắt đầu ký',exact:true});
  await expect(begin).toBeEnabled();await begin.click();
  const start=await page.evaluate(()=>Number(Reflect.get(window,'testObservedFrames')));
  await expect.poll(()=>page.evaluate(()=>Number(Reflect.get(window,'testObservedFrames'))))
    .toBeGreaterThan(start+28);
  await page.getByRole('button',{name:'Xong câu',exact:true}).click();
  await expect(page.getByText(/T0001.*NEG_REST: UNKNOWN.*Chưa đủ điều kiện đo/)).toBeVisible();
  await page.getByRole('button',{name:'Tải kết quả CSV'}).click();
  const csv=await page.getByRole('textbox',{name:'Nội dung CSV để sao chép'}).inputValue();
  expect(csv).toContain('"unmeasurable"');expect(csv).toContain('"face_not_tracked"');
  expect(csv).not.toContain('"correct"');
});

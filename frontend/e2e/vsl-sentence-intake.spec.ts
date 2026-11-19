import { expect, test, type BrowserContext, type Page } from '@playwright/test';

// Synthetic detector and decoded response: these tests do not measure VSL accuracy.
async function prepareCamera(page: Page) {
  await page.addInitScript(() => {
    Object.defineProperty(navigator.mediaDevices, 'getUserMedia', {value: async () => {
      const canvas=document.createElement('canvas');canvas.width=640;canvas.height=480;
      canvas.getContext('2d')!.fillRect(0,0,640,480);return canvas.captureStream(30);
    }});
  });
  await page.route('**/src/services/vsl/HolisticDetector.ts*', route=>route.fulfill({contentType:'application/javascript',body:`
    export class HolisticDetector {
      callbacks=new Set();timer=null;async initialize(){}
      onResults(fn){this.callbacks.add(fn);return ()=>this.callbacks.delete(fn);}
      start(){this.timer=setInterval(()=>{
        const landmarks=Array(411).fill(.5);landmarks[27]=.4;landmarks[30]=.6;
        window.syntheticFrames=(window.syntheticFrames||0)+1;
        for(const fn of this.callbacks)fn({frame:{timestamp_ms:performance.now(),landmarks},
          hands:[Array.from({length:21},()=>({x:.5,y:.5,z:0}))]});
      },40);}
      close(){clearInterval(this.timer);this.callbacks.clear();}
    }`}));
}

async function pair(context: BrowserContext) {
  const nurse=await context.newPage(), patient=await context.newPage();
  await prepareCamera(patient);
  await nurse.goto('/nurse');await patient.goto('/patient');
  const code=nurse.getByTestId('nurse-pairing-code');await expect(code).toHaveText(/^[A-Z0-9]{6}$/);
  for(const key of (await code.innerText()).trim()) await patient.keyboard.press(key);
  await patient.keyboard.press('Enter');
  await expect(patient.getByText('Đã kết nối',{exact:true})).toBeVisible();
  await patient.getByRole('button',{name:/Ký hiệu VSL/}).click();
  await patient.getByRole('button',{name:'Tiếp tục',exact:true}).click();
  await expect(patient.getByRole('button',{name:'Bắt đầu ký',exact:true})).toBeEnabled();
  return {patient,nurse};
}

async function capture(page: Page) {
  await page.getByRole('button',{name:'Bắt đầu ký',exact:true}).click();
  await page.getByTestId('vsl-video-element').scrollIntoViewIfNeeded();
  await expect(page.getByRole('timer')).toBeInViewport();
  await expect(page.getByRole('button',{name:'Xong câu',exact:true})).toBeInViewport();
  const header=await page.getByRole('banner').boundingBox();
  const finish=await page.getByRole('button',{name:'Xong câu',exact:true}).boundingBox();
  expect(finish!.y).toBeGreaterThanOrEqual(header!.y+header!.height);
  const before=await page.evaluate(()=>Number(Reflect.get(window,'syntheticFrames')));
  await expect.poll(()=>page.evaluate(()=>Number(Reflect.get(window,'syntheticFrames')))).toBeGreaterThan(before+28);
  await page.getByRole('button',{name:'Xong câu',exact:true}).click();
}

const chest={success:true,gloss:'ĐAU',confidence:.95,model_source:'vsl_v2_learned_translation',
  intake_suggestion:{chief_complaint_code:'PAIN',pain_present:true,body_regions:['CHEST']}};

test('synthetic full sentence writes pain and chest together, then completes both confirmations',async ({context})=>{
  const updates: Record<string, unknown>[]=[];
  context.on('page',page=>page.on('websocket',socket=>socket.on('framesent',frame=>{
    const message=JSON.parse(String(frame.payload));if(message.event==='INPUT_UPDATED') updates.push(message.payload.patch);
  })));
  const {patient,nurse}=await pair(context);
  let requests=0;
  await patient.route('**/api/vsl/predict',async route=>{
    requests++;const payload=route.request().postDataJSON();
    expect(Object.keys(payload).sort()).toEqual(['context_step','frames']);expect(payload.context_step).toBe('intake');
    await route.fulfill({json:chest});
  });
  await capture(patient);
  await expect(patient.getByText('Ngực',{exact:true})).toBeVisible();
  expect(requests).toBe(1);
  expect(updates.filter(patch=>(patch.chief_complaint as {code:string}).code==='PAIN')).toHaveLength(0);
  await expect(patient.getByRole('button',{name:'Tiếp tục',exact:true})).toBeDisabled();
  await patient.evaluate(()=>scrollTo(0,0));
  await patient.screenshot({path:'test-results/vsl-sentence-synthetic-1024.png',fullPage:true});
  await patient.getByRole('button',{name:'Dùng thông tin này',exact:true}).click();
  await expect(nurse.getByText('Ngực',{exact:true})).toBeVisible();
  const accepted=updates.filter(patch=>(patch.chief_complaint as {code:string}).code==='PAIN');
  expect(accepted).toHaveLength(1);
  expect(accepted[0].pain).toMatchObject({present:true,body_regions:['CHEST'],severity:null,onset:null});
  await expect(patient.getByRole('tab',{name:'Mức đau',exact:true})).toHaveAttribute('aria-selected','true');
  await expect(patient.getByRole('button',{name:'Nhận câu trả lời',exact:true})).toBeDisabled();
  await patient.getByRole('button',{name:'Mức đau 5',exact:true}).click();
  await patient.getByRole('button',{name:'Nhận câu trả lời',exact:true}).click();
  const next=()=>patient.getByRole('button',{name:'Tiếp tục',exact:true}).click();
  await next();await patient.getByRole('button',{name:'2 giờ',exact:true}).click();
  await next();await next();
  await patient.getByRole('button',{name:'Không dị ứng',exact:true}).click();await next();
  await expect(patient.getByText('Có đau — Ngực',{exact:true})).toBeVisible();
  await expect(nurse.getByTestId('btn-verify-intake')).toBeDisabled();
  await patient.getByRole('button',{name:'Đúng, xác nhận',exact:true}).click();
  await expect(nurse.getByTestId('btn-verify-intake')).toBeEnabled();
  await nurse.getByTestId('btn-verify-intake').click();
  await expect(patient.getByText('SỐ THỨ TỰ CỦA BẠN (STT)')).toBeVisible();
});

test('synthetic sentence can be discarded at 720px and an incomplete bundle never becomes a complaint',async ({context})=>{
  const {patient}=await pair(context);await patient.setViewportSize({width:720,height:900});
  let full=true;
  await patient.route('**/api/vsl/predict',route=>route.fulfill({json:full ? chest : {...chest,intake_suggestion:null}}));
  await capture(patient);
  await expect(patient.getByRole('button',{name:'Dùng thông tin này'})).toBeEnabled();
  expect(await patient.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await patient.evaluate(()=>scrollTo(0,0));
  await patient.screenshot({path:'test-results/vsl-sentence-synthetic-720.png',fullPage:true});
  await patient.getByRole('button',{name:'Bỏ gợi ý / Ký lại'}).click();
  await expect(patient.getByRole('button',{name:'Dùng thông tin này'})).toHaveCount(0);
  full=false;await capture(patient);
  await expect(patient.getByText(/Chưa nhận rõ/)).toBeVisible();
  await expect(patient.getByRole('button',{name:'Dùng thông tin này'})).toHaveCount(0);
  await patient.getByRole('button',{name:'Chuyển sang Chạm',exact:true}).click();
  await expect(patient.getByRole('button',{name:'Đau / Nhức',exact:true})).toBeVisible();
  await expect(patient.getByRole('button',{name:'Tiếp tục',exact:true})).toBeDisabled();
});

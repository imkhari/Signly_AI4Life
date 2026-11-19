import {expect, test} from '@playwright/test';

test('holistic assets initialize offline, process a synthetic blank frame and close', async ({page}) => {
  test.setTimeout(60000);
  await page.route('https://**/*', route => route.abort());
  await page.goto('/');
  const result = await page.evaluate(async () => {
    const path = '/src/services/vsl/HolisticDetector.ts';
    const {HolisticDetector} = await import(path);
    const detector = new HolisticDetector();
    await detector.initialize();
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 360;
    canvas.getContext('2d')!.fillRect(0,0,360,360);
    const stream = canvas.captureStream(10);
    const video = document.createElement('video');
    video.muted = true; video.srcObject = stream;
    await video.play();
    let timeout: ReturnType<typeof setTimeout>;
    try {
      return await new Promise<{width:number;hands:number}>((resolve, reject) => {
        timeout = setTimeout(() => reject(new Error('No holistic observations')),15000);
        detector.onResults((observation: {frame:{landmarks:number[]};hands:unknown[]}) => {
          clearTimeout(timeout);
          resolve({width:observation.frame.landmarks.length,hands:observation.hands.length});
        });
        detector.start(video);
      });
    } finally {
      clearTimeout(timeout!); detector.close();
      stream.getTracks().forEach(track => track.stop()); video.srcObject = null;
    }
  });
  expect(result).toEqual({width:411,hands:0});
});

for (const width of [1024,720]) {
  test(`camera V2 ${width}px releases a synthetic stream when switching to touch`, async ({page,request}) => {
    test.setTimeout(60000);
    await page.setViewportSize({width,height:900});
    await page.addInitScript(() => {
      const streams: MediaStream[] = [];
      Object.assign(window, {testCameraStreams:streams});
      Object.defineProperty(navigator.mediaDevices, 'getUserMedia', {value:async () => {
        const canvas = document.createElement('canvas'); canvas.width=640; canvas.height=480;
        canvas.getContext('2d')!.fillRect(0,0,640,480);
        const stream = canvas.captureStream(10); streams.push(stream); return stream;
      }});
    });
    const session = await (await request.post('/api/sessions')).json();
    await page.goto('/patient');
    for (const key of session.pairing_code) await page.keyboard.press(key);
    await page.keyboard.press('Enter');
    await page.getByRole('button',{name:/Ký hiệu VSL/}).click();
    await page.getByRole('button',{name:'Tiếp tục',exact:true}).click();
    await expect(page.getByRole('heading',{name:/Gợi ý cử chỉ qua camera/})).toBeVisible();
    await expect(page.getByText('Đang mở nhận diện camera...',{exact:true})).not.toBeVisible({timeout:30000});
    await page.evaluate(() => window.scrollTo(0,0));
    await page.screenshot({fullPage:true,path:`test-results/camera-v2-${width}.png`});
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.getByRole('button',{name:'Chuyển sang Chạm',exact:true}).click();
    await expect(page.getByTestId('vsl-video-element')).not.toBeVisible();
    expect(await page.evaluate(() => {
      const streams = (window as unknown as {testCameraStreams:MediaStream[]}).testCameraStreams;
      return streams.length > 0 && streams.every(s => s.getTracks().every(t => t.readyState==='ended'));
    })).toBe(true);
  });
}

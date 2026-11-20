import {expect,test} from '@playwright/test';

test('three synthetic touch sessions complete across isolated HTTPS contexts without external resources',async ({browser})=>{
  test.setTimeout(90000);
  const origin='https://127.0.0.1:15443';
  const nurseContext=await browser.newContext({ignoreHTTPSErrors:true});
  const patientContext=await browser.newContext({ignoreHTTPSErrors:true});
  for(const context of [nurseContext,patientContext]){
    await context.route('**/*',route=>{
      const url=new URL(route.request().url());
      return ['127.0.0.1','localhost'].includes(url.hostname) ? route.continue() : route.abort();
    });
  }
  try {
    const nurse=await nurseContext.newPage(),patient=await patientContext.newPage();
    const errors:string[]=[];
    nurse.on('pageerror',error=>errors.push(error.message));patient.on('pageerror',error=>errors.push(error.message));
    await nurse.goto(origin+'/nurse');await patient.goto(origin+'/patient');
    expect(await patient.evaluate(()=>isSecureContext && !!navigator.mediaDevices)).toBe(true);
    const next=()=>patient.getByRole('button',{name:'Tiếp tục',exact:true}).click();
    for(let attempt=0;attempt<3;attempt++){
      const code=nurse.getByTestId('nurse-pairing-code');await expect(code).toHaveText(/^[A-Z0-9]{6}$/);
      const oldCode=(await code.innerText()).trim();
      for(const key of oldCode)await patient.keyboard.press(key);
      await patient.keyboard.press('Enter');
      await expect(patient.getByText('Đã kết nối',{exact:true})).toBeVisible();
      const nurseToken=await nurse.evaluate(()=>sessionStorage.getItem('ai4care_token'));
      const patientToken=await patient.evaluate(()=>sessionStorage.getItem('ai4care_token'));
      expect(nurseToken).toBeTruthy();expect(patientToken).toBeTruthy();expect(nurseToken).not.toBe(patientToken);
      expect(await nurse.evaluate(()=>sessionStorage.getItem('ai4care_role'))).toBe('nurse');
      expect(await patient.evaluate(()=>sessionStorage.getItem('ai4care_role'))).toBe('patient');
      await next();await patient.getByRole('button',{name:'Sốt / Nóng',exact:true}).click();
      await expect(nurse.getByText('Sốt / Nóng',{exact:true})).toBeVisible();
      await next();await patient.getByRole('button',{name:'Không dị ứng',exact:true}).click();await next();
      await patient.getByRole('button',{name:'Đúng, xác nhận'}).click();
      await expect(nurse.getByTestId('btn-verify-intake')).toBeEnabled();
      await nurse.getByTestId('btn-verify-intake').click();
      await expect(patient.getByText('Số thứ tự của bạn (STT)',{exact:true})).toBeVisible();
      await nurse.getByRole('button',{name:'Kết thúc phiên',exact:true}).click();
      await nurse.getByRole('button',{name:'Xác nhận xóa & Làm mới'}).click();
      await expect(patient.getByText('Nhập mã kết nối trạm khám')).toBeVisible();
      expect(await patient.evaluate(()=>sessionStorage.getItem('ai4care_session_id'))).toBeNull();
      expect((await patientContext.request.post(origin+'/api/sessions/join',{data:{pairing_code:oldCode}})).status()).toBe(404);
      await expect(code).not.toHaveText(oldCode);
    }
    expect(errors).toEqual([]);
  } finally {await patientContext.close();await nurseContext.close();}
});

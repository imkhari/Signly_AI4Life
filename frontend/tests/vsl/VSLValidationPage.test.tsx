import {act,fireEvent,render,screen} from '@testing-library/react';
import {beforeEach,expect,it,vi} from 'vitest';
import {VSLValidationPage} from '../../src/features/validation/VSLValidationPage';
import type {CameraTrialResult} from '../../src/services/vsl/SentenceCapture';
const result:CameraTrialResult={gloss:'COUGH',reason:'accepted',frame_count:30,capture_duration_ms:1200,
  candidate_latency_ms:100,response_latency_ms:90,model_source:'vsl_v2_learned_translation'};
vi.mock('../../src/features/patient/components/VSLCameraView',() => ({
  VSLCameraView:({onTrialResult,captureDisabled}:{onTrialResult:(r:CameraTrialResult)=>void;captureDisabled:boolean}) =>
    <button disabled={captureDisabled} onClick={() => onTrialResult(result)}>Emit controlled prediction</button>,
}));
beforeEach(() => {
  vi.stubGlobal('fetch',vi.fn(async (url:string) => ({ok:true,json:async () =>
    url.includes('profile') ? {profile_id:'a'.repeat(64)} : {v2_worker_ready:false}})));
});
it('waits for voluntary start and records a wrong negative once without changing the prediction',async () => {
  render(<VSLValidationPage />);await act(async () => {});
  expect(screen.getByRole('button',{name:'Bắt đầu lượt thử'})).toBeDisabled();
  fireEvent.click(screen.getByRole('checkbox'));
  await act(async () => {fireEvent.click(screen.getByRole('button',{name:'Bắt đầu lượt thử'}));});
  fireEvent.click(screen.getByText('Emit controlled prediction'));
  expect(screen.getByText(/T0001.*NEG_REST: COUGH.*Sai nhãn/)).toBeVisible();
  expect(screen.getByText('Emit controlled prediction')).toBeDisabled();
  expect(screen.getByRole('button',{name:'Tải kết quả CSV'})).toBeEnabled();
});

it('blocks mixing results after the running profile changes',async () => {
  render(<VSLValidationPage />);await act(async () => {});
  fireEvent.click(screen.getByRole('checkbox'));
  await act(async () => {fireEvent.click(screen.getByRole('button',{name:'Bắt đầu lượt thử'}));});
  fireEvent.click(screen.getByText('Emit controlled prediction'));
  fireEvent.click(screen.getByRole('button',{name:'Lượt tiếp theo'}));
  vi.stubGlobal('fetch',vi.fn(async () => ({ok:true,json:async () => ({profile_id:'b'.repeat(64)})})));
  await act(async () => {fireEvent.click(screen.getByRole('button',{name:'Bắt đầu lượt thử'}));});
  expect(screen.getByRole('alert')).toHaveTextContent('Cấu hình đã đổi');
  expect(screen.getByRole('button',{name:'Bắt đầu lượt thử'})).toBeDisabled();
  expect(screen.getByRole('button',{name:'Tải kết quả CSV'})).toBeEnabled();
});

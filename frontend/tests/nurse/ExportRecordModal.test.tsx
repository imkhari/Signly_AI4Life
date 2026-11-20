import {act,fireEvent,render,screen} from '@testing-library/react';
import {beforeEach,expect,it,vi} from 'vitest';
import {ExportRecordModal} from '../../src/features/nurse/components/ExportRecordModal';
import type {SemanticFrame,TriageSummary} from '../../src/types';
const frame:SemanticFrame={schema_version:'1.0',session_id:'synthetic',modality:['touch'],
  chief_complaint:{code:'PAIN',label_vi:'Đau',free_text:null},
  pain:{present:true,severity:3,body_regions:['HEAD'],onset:{value:2,unit:'hour'}},
  allergy:{has_allergy:false,items:[]},extra_symptoms:[],uncertain_fields:[],field_confidence:{},conflicts:[],missing_fields:[]};
const summary:TriageSummary={session_id:'synthetic',intake_code:'AC-TEST',queue_number:1,status:'nurse_verified',frame,
  nl_text_vi:'Bạn có đau đầu.',nl_source:'fallback_template',fallback_reason:null,validator:{passed:true,violations:[]},alerts:[],
  nurse_view:{confirmed:[],needs_attention:[]},flags:{interpreter_requested:false,emergency_flag:false},timestamps:{created:'2026-11-20'}};
const props={isOpen:true,onClose:vi.fn(),queueNumber:1,intakeCode:'AC-TEST',frame,summary,canExport:true};
beforeEach(()=>vi.spyOn(window,'print').mockImplementation(()=>{}));

it('does not render a confirmed printable sheet or allow printing while ineligible',()=>{
  const send=vi.fn();
  const view=render(<ExportRecordModal {...props} canExport={false} onConfirmExport={send}/>);
  expect(document.querySelector('#printable-triage-record')).toBeNull();
  expect(screen.getByRole('button',{name:'In phiếu bàn giao'})).toBeDisabled();
  view.rerender(<ExportRecordModal {...props} summary={null} onConfirmExport={send}/>);
  expect(document.querySelector('#printable-triage-record')).toBeNull();
  expect(send).not.toHaveBeenCalled();expect(window.print).not.toHaveBeenCalled();
});

it('waits for backend acceptance and suppresses duplicate print requests',async ()=>{
  let resolve!:(value:boolean)=>void;
  const send=vi.fn(()=>new Promise<boolean>(r=>{resolve=r;}));
  render(<ExportRecordModal {...props} onConfirmExport={send}/>);
  fireEvent.click(screen.getByRole('button',{name:'In phiếu bàn giao'}));
  expect(window.print).not.toHaveBeenCalled();
  expect(screen.getByRole('button',{name:/Đang chờ xác nhận xuất phiếu/})).toBeDisabled();
  await act(async ()=>resolve(true));
  expect(send).toHaveBeenCalledOnce();expect(window.print).toHaveBeenCalledOnce();
});

it.each(['disconnect','close','server_reject'])('does not print a stale or rejected request: %s',async cause=>{
  let resolve!:(value:boolean)=>void;
  const send=vi.fn(()=>new Promise<boolean>(r=>{resolve=r;}));
  const view=render(<ExportRecordModal {...props} onConfirmExport={send}/>);
  fireEvent.click(screen.getByRole('button',{name:'In phiếu bàn giao'}));
  if(cause==='disconnect')view.rerender(<ExportRecordModal {...props} canExport={false} onConfirmExport={send}/>);
  if(cause==='close')view.rerender(<ExportRecordModal {...props} isOpen={false} onConfirmExport={send}/>);
  await act(async ()=>resolve(cause!=='server_reject'));
  expect(window.print).not.toHaveBeenCalled();
  if(cause==='server_reject')expect(screen.getByRole('alert')).toHaveTextContent('Chưa xuất được phiếu');
});

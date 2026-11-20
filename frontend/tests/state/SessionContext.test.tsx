import {act,renderHook} from '@testing-library/react';
import {expect,it} from 'vitest';
import {SessionProvider,useSession} from '../../src/state/SessionContext';
import {sessionStore} from '../../src/services/storage/sessionStore';

it('starts a new session without carrying the previous patient frame, approval or support state',()=>{
  const {result}=renderHook(()=>useSession(),{wrapper:SessionProvider});
  act(()=>result.current.dispatch({type:'INIT_SESSION',payload:{sessionId:'old',role:'nurse',token:'synthetic-old',pairingCode:'OLD123'}}));
  const frame={...result.current.state.frame,chief_complaint:{code:'PAIN',label_vi:'Đau',free_text:null},
    pain:{present:true,severity:7,body_regions:['CHEST']},allergy:{has_allergy:true,items:[]}};
  act(()=>{
    result.current.dispatch({type:'FRAME_UPDATED',payload:{frame,alerts:[],completeness:1,step:'confirm'}});
    result.current.dispatch({type:'SUMMARY_READY',payload:{session_id:'old',intake_code:'AC-OLD',queue_number:7,status:'summary_ready',frame,
      nl_text_vi:'Thông tin giả lập.',nl_source:'fallback_template',fallback_reason:null,validator:{passed:true,violations:[]},alerts:[],
      nurse_view:{confirmed:[],needs_attention:[]},flags:{interpreter_requested:false,emergency_flag:false},timestamps:{created:'2026-11-20'}}});
    result.current.dispatch({type:'NURSE_VERIFIED',payload:{intakeCode:'AC-OLD',queueNumber:7}});
    result.current.dispatch({type:'SET_INTERPRETER_STATUS',payload:'connecting'});
    result.current.dispatch({type:'TOGGLE_LARGE_TEXT'});
  });
  const preference=result.current.state.a11y.largeText;
  sessionStore.setLastSeq(77);
  act(()=>result.current.dispatch({type:'INIT_SESSION',payload:{sessionId:'new',role:'nurse',token:'synthetic-new',pairingCode:'NEW123'}}));
  expect(result.current.state.frame.chief_complaint.code).toBeNull();
  expect(result.current.state.frame.pain.body_regions).toEqual([]);
  expect(result.current.state.frame.allergy.has_allergy).toBeNull();
  expect(result.current.state.summary).toBeNull();expect(result.current.state.queueNumber).toBeNull();
  expect(result.current.state.intakeCode).toBeNull();expect(result.current.state.interpreterRequested).toBe(false);
  expect(result.current.state.status).toBe('created');expect(result.current.state.a11y.largeText).toBe(preference);
  expect(sessionStore.getLastSeq()).toBe(0);
});

it('shows patient joined only after the existing server event and preserves later workflow state',()=>{
  const {result}=renderHook(()=>useSession(),{wrapper:SessionProvider});
  act(()=>result.current.dispatch({type:'INIT_SESSION',payload:{sessionId:'new',role:'nurse',token:'synthetic'}}));
  expect(result.current.state.status).toBe('created');
  act(()=>result.current.dispatch({type:'PATIENT_JOINED'}));expect(result.current.state.status).toBe('paired');
  act(()=>result.current.dispatch({type:'NURSE_VERIFIED',payload:{intakeCode:'AC-T',queueNumber:1}}));
  act(()=>result.current.dispatch({type:'PATIENT_JOINED'}));expect(result.current.state.status).toBe('nurse_verified');
});

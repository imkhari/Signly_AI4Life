import {act,renderHook} from '@testing-library/react';
import {beforeEach,expect,it,vi} from 'vitest';
import {SessionProvider,useSession} from '../src/state/SessionContext';
import {useSessionSocket} from '../src/hooks/useSessionSocket';
import {socketClient} from '../src/services/ws/socketClient';

vi.mock('../src/services/ws/socketClient',()=>({socketClient:{
  connect:vi.fn(),disconnect:vi.fn(),send:vi.fn(),
  on:vi.fn(()=>()=>{}),onStatusChange:vi.fn(()=>()=>{}),
}}));
beforeEach(()=>vi.clearAllMocks());

it.each([false,true])('clears local patient data on idle expiry even if reset delivery is uncertain (%s)',sent=>{
  vi.mocked(socketClient.send).mockReturnValue(sent);
  const {result,unmount}=renderHook(()=>({session:useSession(),socket:useSessionSocket()}),{wrapper:SessionProvider});
  act(()=>result.current.session.dispatch({type:'INIT_SESSION',payload:{sessionId:'synthetic',role:'patient',token:'synthetic-token',pairingCode:'ABC123'}}));
  const frame={...result.current.session.state.frame,chief_complaint:{code:'PAIN',label_vi:'Đau',free_text:null}};
  act(()=>result.current.session.dispatch({type:'FRAME_UPDATED',payload:{frame,alerts:[],completeness:.5,step:'symptoms'}}));
  expect(result.current.session.state.frame.chief_complaint.code).toBe('PAIN');
  act(()=>{result.current.socket.resetSession('timeout');});
  expect(socketClient.send).toHaveBeenCalledWith('SESSION_RESET',{reason:'timeout',wipe:true});
  expect(result.current.session.state.sessionId).toBeNull();
  expect(result.current.session.state.frame.chief_complaint.code).toBeNull();
  expect(sessionStorage.getItem('ai4care_token')).toBeNull();
  expect(socketClient.disconnect).toHaveBeenCalled();unmount();
});

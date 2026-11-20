import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import type {SocketClient} from '../../src/services/ws/socketClient';
import {requestRecordExport} from '../../src/services/ws/requestExport';

function socket() {
  const events=new Map<string,(payload:unknown)=>void>();
  const statuses=new Set<(status:string)=>void>();
  const stub={getStatus:vi.fn(()=> 'connected'),send:vi.fn(()=>true),
    on:vi.fn((name:string,handler:(payload:unknown)=>void)=>{
      events.set(name,handler);return ()=>{events.delete(name);};
    }),
    onStatusChange:vi.fn((handler:(status:string)=>void)=>{
      statuses.add(handler);handler('connected');return ()=>{statuses.delete(handler);};
    })};
  return {client:stub as unknown as SocketClient,stub,events,statuses};
}
beforeEach(()=>vi.useFakeTimers());afterEach(()=>vi.useRealTimers());

it('waits for a matching server acceptance and releases all listeners/timers',async ()=>{
  const s=socket();let completed=false;
  const accepted=requestRecordExport(s.client,'print').then(value=>{completed=true;return value;});
  expect(s.stub.send).toHaveBeenCalledWith('RECORD_EXPORTED',expect.objectContaining({format:'print',target:'doctor'}));
  s.events.get('RECORD_EXPORTED')?.({format:'json'});
  await Promise.resolve();expect(completed).toBe(false);
  s.events.get('RECORD_EXPORTED')?.({format:'print'});
  expect(await accepted).toBe(true);
  expect(s.events.size).toBe(0);expect(s.statuses.size).toBe(0);expect(vi.getTimerCount()).toBe(0);
});

it.each(['ERROR','SESSION_RESET','disconnect','timeout','send_failed'])('does not print on %s',async failure=>{
  const s=socket();if(failure==='send_failed')s.stub.send.mockReturnValue(false);
  const accepted=requestRecordExport(s.client,'print');
  if (failure==='disconnect')s.statuses.forEach(handler=>handler('reconnecting'));
  else if(failure==='timeout')vi.advanceTimersByTime(5000);
  else if(failure!=='send_failed')s.events.get(failure)?.({});
  expect(await accepted).toBe(false);
  expect(s.events.size).toBe(0);expect(s.statuses.size).toBe(0);expect(vi.getTimerCount()).toBe(0);
});

it('does not send or attach listeners while disconnected',async ()=>{
  const s=socket();s.stub.getStatus.mockReturnValue('disconnected');
  expect(await requestRecordExport(s.client,'print')).toBe(false);
  expect(s.stub.send).not.toHaveBeenCalled();expect(s.events.size).toBe(0);
});

import {act,cleanup,renderHook} from '@testing-library/react';
import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {useIdleReset} from '../src/hooks/useIdleReset';

beforeEach(()=>vi.useFakeTimers());
afterEach(()=>{cleanup();vi.useRealTimers();});

it('keeps the 60 second warning visible and expires once after ten idle minutes',()=>{
  const expired=vi.fn();
  const {result}=renderHook(()=>useIdleReset({onTimeout:expired}));
  act(()=>vi.advanceTimersByTime(540000));
  expect(result.current.showWarning).toBe(true);
  expect(result.current.secondsRemaining).toBe(60);
  act(()=>vi.advanceTimersByTime(59000));
  expect(result.current.showWarning).toBe(true);
  expect(result.current.secondsRemaining).toBe(1);
  expect(expired).not.toHaveBeenCalled();
  act(()=>vi.advanceTimersByTime(1000));
  expect(expired).toHaveBeenCalledOnce();
  act(()=>vi.advanceTimersByTime(600000));
  expect(expired).toHaveBeenCalledOnce();
});

it('preserves the deadline across rerenders and invokes the latest callback',()=>{
  const first=vi.fn(),latest=vi.fn();
  const {rerender}=renderHook(({onTimeout})=>useIdleReset({onTimeout}),
    {initialProps:{onTimeout:first}});
  act(()=>vi.advanceTimersByTime(500000));
  rerender({onTimeout:latest});
  act(()=>vi.advanceTimersByTime(100000));
  expect(first).not.toHaveBeenCalled();expect(latest).toHaveBeenCalledOnce();
});

it('restarts on activity before warning and only explicit dismissal continues at warning',()=>{
  const expired=vi.fn();
  const {result}=renderHook(()=>useIdleReset({onTimeout:expired}));
  act(()=>vi.advanceTimersByTime(500000));
  act(()=>window.dispatchEvent(new Event('pointerdown')));
  act(()=>vi.advanceTimersByTime(540000));
  expect(result.current.showWarning).toBe(true);
  act(()=>window.dispatchEvent(new KeyboardEvent('keydown',{key:'a'})));
  expect(result.current.showWarning).toBe(true);
  act(()=>result.current.dismissWarning());
  expect(result.current.showWarning).toBe(false);
  act(()=>vi.advanceTimersByTime(539000));
  expect(expired).not.toHaveBeenCalled();expect(result.current.showWarning).toBe(false);
  act(()=>vi.advanceTimersByTime(61000));
  expect(expired).toHaveBeenCalledOnce();
});

it('clears warning and timers when disabled or unmounted',()=>{
  const expired=vi.fn();
  const {result,rerender,unmount}=renderHook(({enabled})=>useIdleReset({onTimeout:expired,enabled}),
    {initialProps:{enabled:true}});
  act(()=>vi.advanceTimersByTime(540000));
  rerender({enabled:false});
  expect(result.current.showWarning).toBe(false);
  act(()=>vi.advanceTimersByTime(600000));
  expect(expired).not.toHaveBeenCalled();
  rerender({enabled:true});unmount();
  expect(vi.getTimerCount()).toBe(0);
});

import {act,fireEvent,render,screen} from '@testing-library/react';
import {beforeEach,expect,it,vi} from 'vitest';
import {MemoryRouter} from 'react-router-dom';
import {SessionProvider} from '../../src/state/SessionContext';
import {NurseHeader} from '../../src/features/nurse/components/NurseHeader';

const props={queueNumber:1,onQueueNumberChange:vi.fn(),intakeCode:'AC-TEST',pairingCode:'ABC123',
  socketStatus:'connected' as const,sessionStatus:'collecting' as const,audioAlertEnabled:true,
  onToggleAudioAlert:vi.fn(),onRequestInterpreter:vi.fn(),onOpenExport:vi.fn(),onOpenReset:vi.fn()};
const wrapper=({children}:{children:React.ReactNode})=><MemoryRouter><SessionProvider>{children}</SessionProvider></MemoryRouter>;
beforeEach(()=>vi.clearAllMocks());

it('reports success only after clipboard writing succeeds',async ()=>{
  let resolve!:()=>void;
  Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:vi.fn(()=>new Promise<void>(r=>{resolve=r;}))}});
  render(<NurseHeader {...props}/>,{wrapper});
  fireEvent.click(screen.getByRole('button',{name:'Sao chép mã ghép nối'}));
  expect(screen.queryByText('Đã sao chép mã ghép nối.')).not.toBeInTheDocument();
  expect(screen.getByRole('button',{name:'Sao chép mã ghép nối'})).toBeDisabled();
  await act(async ()=>resolve());
  expect(screen.getByText('Đã sao chép mã ghép nối.')).toBeVisible();
});

it.each([true,false])('keeps the code visible when clipboard is rejected or unavailable (%s)',async available=>{
  Object.defineProperty(navigator,'clipboard',{configurable:true,value:available ? {writeText:vi.fn().mockRejectedValue(new Error('Denied'))} : undefined});
  render(<NurseHeader {...props}/>,{wrapper});
  await act(async ()=>fireEvent.click(screen.getByRole('button',{name:'Sao chép mã ghép nối'})));
  expect(screen.getByText(/Chưa sao chép được/)).toBeVisible();
  expect(screen.getByTestId('nurse-pairing-code')).toHaveTextContent('ABC123');
  expect(screen.queryByText('Đã sao chép mã ghép nối.')).not.toBeInTheDocument();
});

it('does not report an old code as copied after a new code arrives',async ()=>{
  let resolve!:()=>void;
  Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:vi.fn(()=>new Promise<void>(r=>{resolve=r;}))}});
  const view=render(<NurseHeader {...props}/>,{wrapper});
  fireEvent.click(screen.getByRole('button',{name:'Sao chép mã ghép nối'}));
  view.rerender(<NurseHeader {...props} pairingCode="NEW123"/>);
  await act(async ()=>resolve());
  expect(screen.queryByText('Đã sao chép mã ghép nối.')).not.toBeInTheDocument();
});

it('keeps export disabled until the parent confirms all export conditions',()=>{
  const view=render(<NurseHeader {...props}/>,{wrapper});
  expect(screen.getByRole('button',{name:'Xuất hồ sơ bàn giao'})).toBeDisabled();
  view.rerender(<NurseHeader {...props} canExport/>);
  expect(screen.getByRole('button',{name:'Xuất hồ sơ bàn giao'})).toBeEnabled();
});

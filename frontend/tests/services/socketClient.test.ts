import {afterEach,expect,it,vi} from 'vitest';
import {SocketClient} from '../../src/services/ws/socketClient';
afterEach(()=>vi.unstubAllGlobals());
it('returns a failed send instead of throwing when the socket closes during send',()=>{
  class ClosingSocket {
    static OPEN=1;readyState=1;
    send(){throw new Error('Socket closed during send');}
    close(){}
  }
  vi.stubGlobal('WebSocket',ClosingSocket);
  const client=new SocketClient();client.connect({sessionId:'synthetic',role:'patient',token:'synthetic'});
  expect(client.send('SESSION_RESET',{reason:'timeout',wipe:true})).toBe(false);
  client.disconnect();
});

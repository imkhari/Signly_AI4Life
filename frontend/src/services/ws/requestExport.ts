import type {SocketClient} from './socketClient';

// The existing RECORD_EXPORTED event confirms that the server accepted the export.
export function requestRecordExport(
  client:SocketClient, format:'pdf'|'print'|'json', timeoutMs=5000,
):Promise<boolean> {
  if (client.getStatus()!=='connected') return Promise.resolve(false);
  return new Promise(resolve=>{
    let settled=false;
    let timer:ReturnType<typeof setTimeout>|null=null;
    const cleanup:(()=>void)[]=[];
    const finish=(accepted:boolean)=>{
      if (settled) return;
      settled=true;
      if (timer!==null) clearTimeout(timer);
      cleanup.forEach(unsubscribe=>unsubscribe());
      resolve(accepted);
    };
    cleanup.push(client.on<{format:string}>('RECORD_EXPORTED',payload=>{
      if (payload.format===format) finish(true);
    }));
    cleanup.push(client.on('ERROR',()=>finish(false)));
    cleanup.push(client.on('SESSION_RESET',()=>finish(false)));
    const unsubscribeStatus=client.onStatusChange(status=>{
      if (status!=='connected') finish(false);
    });
    if (settled) {unsubscribeStatus();return;}
    cleanup.push(unsubscribeStatus);
    timer=setTimeout(()=>finish(false),timeoutMs);
    try {
      if (!client.send('RECORD_EXPORTED',{
        format,include:['queue_number','intake_code','confirmed_symptoms','alerts'],target:'doctor',
      })) finish(false);
    } catch {finish(false);}
  });
}

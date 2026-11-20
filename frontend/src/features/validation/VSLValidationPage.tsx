import { useCallback, useEffect, useRef, useState } from 'react';
import { VSLCameraView } from '../patient/components/VSLCameraView';
import type { CameraTrialResult } from '../../services/vsl/SentenceCapture';
import policy from '../../services/vsl/validationProtocol.json';
import { Button } from '../../ui/Button';
import { vi } from '../../i18n/vi';

type Row = Record<string,string>;
const fields=['trial_id','participant_code','cohort','split','signing_familiarity','device_code',
  'worker_state','intent_id','context','condition','expected_label','displayed_candidate','ever_wrong_candidate','outcome',
  'candidate_latency_ms','response_latency_ms','frame_count','capture_duration_ms','reason','profile_id','evidence_kind'];
const csvCell=(value:string) => `"${value.replace(/"/g,'""')}"`;

export function VSLValidationPage() {
  const synthetic=new URLSearchParams(window.location.search).get('evidence')==='synthetic';
  const [profile,setProfile]=useState<string|null>(null);
  const [consent,setConsent]=useState(false);
  const [participant,setParticipant]=useState('P01');
  const [device,setDevice]=useState('D01');
  const [familiarity,setFamiliarity]=useState('learning');
  const [condition,setCondition]=useState('normal');
  const [intentId,setIntentId]=useState('NEG_REST');
  const cameraAreaRef=useRef<HTMLDivElement|null>(null);
  const [needsReload,setNeedsReload]=useState(false);
  const [preparing,setPreparing]=useState(false);
  const [workerState,setWorkerState]=useState('unknown');
  const [active,setActive]=useState(false);
  const [locked,setLocked]=useState(false);
  const [rows,setRows]=useState<Row[]>([]);
  const [applied,setApplied]=useState(false);
  const [exportText,setExportText]=useState('');
  const [exportMessage,setExportMessage]=useState('');
  const recordedRef=useRef(false);
  const reference=policy.intents.find(intent => intent.id===intentId)!;
  const split=policy.participants[participant as keyof typeof policy.participants];

  useEffect(() => {
    const controller=new AbortController();
    fetch(`/vsl-validation-profile.json?t=${Date.now()}`,{signal:controller.signal,cache:'no-store'})
      .then(response => {if(!response.ok) throw new Error();return response.json();})
      .then(data => {if(/^[a-f0-9]{64}$/.test(data.profile_id)) setProfile(data.profile_id);})
      .catch(() => {});
    return () => controller.abort();
  },[]);

  useEffect(() => {
    if(active) cameraAreaRef.current?.scrollIntoView?.({block:'start',behavior:'auto'});
  },[active]);


  const record=useCallback((result:CameraTrialResult) => {
    if(recordedRef.current || !profile) return;
    recordedRef.current=true;
    const wrong=result.gloss!=='UNKNOWN' && result.gloss!==reference.expected;
    const expectedTrackingFailure=reference.kind==='negative_invalid' &&
      (result.reason==='tracking_gap' || result.reason==='missing_shoulders');
    const measured=result.reason==='accepted' || result.reason==='unknown';
    const outcome=result.reason==='cancelled' ? 'aborted' : wrong ? 'wrong' :
      (reference.kind==='negative_invalid' ? !expectedTrackingFailure : !measured) ? 'unmeasurable' :
      result.gloss===reference.expected ? 'correct' : 'rejected';
    setRows(previous => [...previous,{
      trial_id:`T${String(previous.length+1).padStart(4,'0')}`,participant_code:participant,
      cohort:'internal',split,signing_familiarity:familiarity,device_code:device,worker_state:workerState,intent_id:intentId,
      context:reference.context,condition,expected_label:reference.expected,
      displayed_candidate:result.gloss,ever_wrong_candidate:String(wrong),outcome,
      candidate_latency_ms:result.candidate_latency_ms===null ? '' : result.candidate_latency_ms.toFixed(2),
      response_latency_ms:result.response_latency_ms===null ? '' : result.response_latency_ms.toFixed(2),
      frame_count:String(result.frame_count),capture_duration_ms:result.capture_duration_ms.toFixed(2),
      reason:result.reason,profile_id:profile,evidence_kind:synthetic ? 'synthetic' : 'live_internal',
    }]);
    setLocked(true);
  },[profile,reference,participant,split,familiarity,device,intentId,condition,synthetic,workerState]);

  const download=() => {
    const text=[fields.join(','),...rows.map(row => fields.map(key => csvCell(row[key])).join(','))].join('\n')+'\n';
    setExportText(text);setExportMessage(vi.validation.exportPrepared);
    const url=URL.createObjectURL(new Blob(['\uFEFF',text],{type:'text/csv;charset=utf-8'}));
    const anchor=document.createElement('a');anchor.href=url;anchor.download='vsl-v2-trials.csv';anchor.click();
    setTimeout(() => URL.revokeObjectURL(url),1000);
  };
  const selectClass='block w-full min-h-[64px] border-2 rounded-xl p-3 text-lg';

  return <main lang="vi" className="max-w-5xl mx-auto p-4 sm:p-8 space-y-5">
    <h1 className="text-3xl font-bold">{vi.validation.title}</h1>
    {synthetic && <p role="status">{vi.validation.synthetic}</p>}
    <p className="text-lg">{vi.validation.scope}</p>
    <p className="text-lg">{vi.validation.privacy}</p>
    <p role="status">{profile ? vi.validation.profileReady : vi.validation.profileMissing}</p>
    <label className="flex gap-3 items-center text-lg min-h-[64px]">
      <input type="checkbox" checked={consent} disabled={active || preparing} onChange={event => setConsent(event.target.checked)} className="w-8 h-8" />
      {vi.validation.consent}
    </label>
    <h2 className="text-2xl font-bold">{vi.presentation.validationSetup}</h2>
    <fieldset disabled={active || preparing} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <label>{vi.validation.participant}<select className={selectClass} value={participant} onChange={event => setParticipant(event.target.value)}>
        {Object.entries(policy.participants).map(([code,part]) => <option key={code} value={code}>{code} — {part==='final' ? vi.validation.finalPhase : vi.validation.developmentPhase}</option>)}
      </select></label>
      <label>{vi.validation.familiarity}<select className={selectClass} value={familiarity} onChange={event => setFamiliarity(event.target.value)}>
        {policy.familiarities.map(value => <option key={value} value={value}>{vi.validation.familiarities[value as keyof typeof vi.validation.familiarities]}</option>)}
      </select></label>
      <label>{vi.validation.device}<select className={selectClass} value={device} onChange={event => setDevice(event.target.value)}>
        {policy.devices.map(value => <option key={value}>{value}</option>)}
      </select></label>
      <label>{vi.validation.condition}<select className={selectClass} value={condition} onChange={event => setCondition(event.target.value)}>
        {policy.conditions.map(value => <option key={value} value={value}>{vi.validation.conditions[value as keyof typeof vi.validation.conditions]}</option>)}
      </select></label>
      <label className="sm:col-span-2">{vi.validation.intent}<select className={selectClass} value={intentId} onChange={event => setIntentId(event.target.value)}>
        {policy.intents.map(intent => <option key={intent.id} value={intent.id}>{intent.label}</option>)}
      </select></label>
    </fieldset>
    <p className="text-lg font-semibold">{reference.kind==='negative_valid' || reference.kind==='negative_invalid' ? vi.validation.negativeInstruction : vi.validation.positiveInstruction}</p>
    {needsReload && <p role="alert">{vi.validation.profileChanged}</p>}
    {split==='final' && <p className="text-lg">{vi.validation.finalNotice}</p>}
    <h2 className="text-2xl font-bold">{vi.presentation.validationCapture}</h2>
    {!active ? <Button disabled={!consent || !profile || preparing || needsReload} onClick={async () => {
      setPreparing(true);
      try {
        const versionResponse=await fetch(`/vsl-validation-profile.json?t=${Date.now()}`,{cache:'no-store'});
        if(!versionResponse.ok) throw new Error();
        const fresh=await versionResponse.json();
        if(fresh.profile_id!==profile || (rows.length>0 && rows[0].profile_id!==fresh.profile_id)) {
          setNeedsReload(true);setPreparing(false);return;
        }
      } catch {setNeedsReload(true);setPreparing(false);return;}
      try {
        const response=await fetch('/api/vsl/status',{cache:'no-store'});
        const status=await response.json();
        setWorkerState(typeof status.v2_worker_ready==='boolean' ? (status.v2_worker_ready ? 'ready' : 'not_ready') : 'unknown');
      } catch {setWorkerState('unknown');}
      recordedRef.current=false;setLocked(false);setApplied(false);setPreparing(false);setActive(true);
    }}>{vi.validation.startTrial}</Button> : <>
      <div ref={cameraAreaRef}><VSLCameraView contextStep="intake" captureDisabled={locked}
        onApplyGlosses={() => {}} onApplyIntakeSuggestion={() => setApplied(true)}
        onSwitchToTouchMode={() => {
          if (!recordedRef.current) record({gloss:'UNKNOWN',reason:'cancelled',frame_count:0,capture_duration_ms:0,
            candidate_latency_ms:null,response_latency_ms:null,model_source:'vsl_v2_learned_translation'});
          setActive(false);
        }} onTrialResult={record} /></div>
      {applied && <p>{vi.validation.applied}</p>}
      {locked && <a href="#vsl-validation-results" className="inline-flex min-h-[64px] items-center text-action underline">{vi.validation.viewResults}</a>}
      <div>{locked ? <Button onClick={() => setActive(false)}>{vi.validation.nextTrial}</Button> :
        <Button variant="secondary" onClick={() => {
          record({gloss:'UNKNOWN',reason:'cancelled',frame_count:0,capture_duration_ms:0,
            candidate_latency_ms:null,response_latency_ms:null,model_source:'vsl_v2_learned_translation'});
          setActive(false);
        }}>{vi.validation.cancelTrial}</Button>}</div>
    </>}
    <section id="vsl-validation-results" aria-live="polite" className="space-y-3">
      <h2 className="text-2xl font-bold">{vi.validation.results} ({rows.length})</h2>
      {rows.map(row => <p key={row.trial_id} className="p-3 border rounded-xl text-lg">
        {row.trial_id} · {row.participant_code} · {row.intent_id}: {row.displayed_candidate} · {vi.validation.outcomes[row.outcome as keyof typeof vi.validation.outcomes]}
        {row.candidate_latency_ms && ` · ${row.candidate_latency_ms} ms`}
        {' · '}{vi.camera.reasons[row.reason as keyof typeof vi.camera.reasons]}
        {policy.intents.find(item => item.id===row.intent_id)?.kind==='negative_valid' &&
          row.outcome==='unmeasurable' && <span className="block font-semibold">{vi.validation.ineligibleNegative}</span>}
      </p>)}
      <Button onClick={download} disabled={rows.length===0 || (active && !locked)}>{vi.validation.export}</Button>
      {exportText && <div className="space-y-3">
        <p role="status">{exportMessage}</p>
        <label className="block font-bold">{vi.validation.csvText}
          <textarea readOnly value={exportText} onFocus={event => event.currentTarget.select()}
            className="block w-full h-40 p-3 border-2 rounded-xl font-mono text-sm" />
        </label>
        <Button variant="secondary" onClick={async () => {
          try { await navigator.clipboard.writeText(exportText);setExportMessage(vi.validation.csvCopied); }
          catch {setExportMessage(vi.validation.copyManually);}
        }}>{vi.validation.copyCsv}</Button>
      </div>}
    </section>
  </main>;
}

import React, { useState } from 'react';
import { Clock } from 'lucide-react';
import {
  IconBandage,
  IconCheckupList,
  IconDroplet,
  IconHeartbeat,
  IconHelpCircle,
  IconLungs,
  IconMoodConfuzed,
  IconStethoscope,
  IconTemperature,
  IconVirus,
} from '@tabler/icons-react';
import { BodyMap } from './BodyMap';
import { PainSlider } from './PainSlider';
import { VSLCameraView } from './VSLCameraView';
import { Button } from '../../../ui/Button';
import { ModalityType, OnsetUnit } from '../../../types';
import { RecognizedGloss } from '../../../services/vsl/types';
import { vi } from '../../../i18n/vi';
import type { IntakeSuggestion } from '../../../types/vsl';
import { sentencePatch, SENTENCE_REGIONS } from '../sentenceIntake';

export interface SymptomsData {
  chiefComplaintCode: string | null;
  chiefComplaintLabel: string | null;
  hasPain: boolean | null;
  severity: number | null;
  bodyRegions: string[];
  extraSymptoms?: string[];
  onsetValue: number | null;
  onsetUnit: OnsetUnit | null;
}

export interface SymptomsStepProps {
  initialTab?: SymptomTab;
  data: SymptomsData;
  selectedMode?: ModalityType;
  onChange: (updated: Partial<SymptomsData>) => void;
  onBack: () => void;
  onNext: () => void;
  onSwitchMode?: (mode: ModalityType) => void;
  connected?: boolean;
  frameKey?: string;
}

interface ComplaintOption {
  code: string;
  label: string;
  icon: React.ReactNode;
}

const CHIEF_COMPLAINTS: ComplaintOption[] = [
  {
    code: 'PAIN',
    label: 'Đau / Nhức',
    icon: <IconHeartbeat className="w-8 h-8 text-rose-500" stroke={1.8} />,
  },
  {
    code: 'FEVER',
    label: 'Sốt / Nóng',
    icon: <IconTemperature className="w-8 h-8 text-amber-500" stroke={1.8} />,
  },
  {
    code: 'COUGH',
    label: 'Ho / Đau họng',
    icon: <IconStethoscope className="w-8 h-8 text-cyan-600" stroke={1.8} />,
  },
  {
    code: 'BREATH_DIFFICULTY',
    label: 'Khó thở',
    icon: <IconLungs className="w-8 h-8 text-blue-500" stroke={1.8} />,
  },
  {
    code: 'DIZZY',
    label: 'Chóng mặt',
    icon: <IconMoodConfuzed className="w-8 h-8 text-purple-500" stroke={1.8} />,
  },
  {
    code: 'INJURY',
    label: 'Chấn thương / Ngã',
    icon: <IconBandage className="w-8 h-8 text-emerald-500" stroke={1.8} />,
  },
  {
    code: 'BLEED',
    label: 'Chảy máu',
    icon: <IconDroplet className="w-8 h-8 text-red-600" stroke={1.8} />,
  },
  {
    code: 'RASH',
    label: 'Nổi mẩn / Ngứa',
    icon: <IconVirus className="w-8 h-8 text-orange-500" stroke={1.8} />,
  },
  {
    code: 'CHECKUP',
    label: 'Khám định kỳ',
    icon: <IconCheckupList className="w-8 h-8 text-teal-600" stroke={1.8} />,
  },
  {
    code: 'OTHER',
    label: 'Khác',
    icon: <IconHelpCircle className="w-8 h-8 text-slate-500" stroke={1.8} />,
  },
];

const ONSET_UNITS: { unit: OnsetUnit; label: string }[] = [
  { unit: 'minute', label: 'Phút' },
  { unit: 'hour', label: 'Giờ' },
  { unit: 'day', label: 'Ngày' },
  { unit: 'week', label: 'Tuần' },
  { unit: 'month', label: 'Tháng' },
];

export type SymptomTab = 'complaint' | 'pain_body' | 'pain_scale' | 'onset' | 'extras';

export const SymptomsStep: React.FC<SymptomsStepProps> = ({
  data, initialTab = 'complaint', selectedMode = 'touch', onChange, onBack, onNext, onSwitchMode,
  connected = true, frameKey,
}) => {
  const [activeTab, setActiveTab] = useState<SymptomTab>(initialTab);
  const [cameraOpen, setCameraOpen] = useState(selectedMode === 'vsl_gloss');
  const [sentenceFlow, setSentenceFlow] = useState(false);
  const extras = data.extraSymptoms || [];
  const isPainRelevant = data.hasPain === true || activeTab === 'pain_body';
  const tabs: { id: SymptomTab; label: string }[] = [
    { id: 'complaint', label: vi.intake.main },
    { id: 'pain_body', label: vi.intake.location },
    { id: 'pain_scale', label: vi.intake.severity },
    { id: 'onset', label: vi.intake.onset },
    { id: 'extras', label: vi.intake.extras },
  ];
  const cameraSupported = !['pain_scale', 'onset'].includes(activeTab);
  const showCamera = cameraSupported && cameraOpen && (activeTab !== 'pain_body' || data.hasPain === true);
  const contextStep = activeTab === 'pain_body' ? 'location' :
    activeTab === 'pain_scale' || activeTab === 'onset' ? 'severity' :
    activeTab === 'complaint' ? 'intake' : 'symptom';
  const intakeCamera = showCamera && contextStep === 'intake';
  const applySentence = (suggestion: IntakeSuggestion) => {
    if (!connected) return;
    onChange(sentencePatch(data, suggestion));
    setCameraOpen(false); setSentenceFlow(true);
    setActiveTab(suggestion.pain_present === true && suggestion.body_regions.length ? 'pain_scale' : 'pain_body');
  };
  const continueDetails = () => {
    if (!sentenceFlow) { onNext(); return; }
    const next: Record<SymptomTab, SymptomTab | null> = {
      complaint: 'pain_body', pain_body: data.hasPain === true ? 'pain_scale' : 'extras',
      pain_scale: 'onset', onset: 'extras', extras: null,
    };
    const tab = next[activeTab];
    if (tab) { setCameraOpen(false); setActiveTab(tab); } else onNext();
  };

  const applyGlosses = (glosses: RecognizedGloss[]) => {
    if (activeTab === 'complaint' || activeTab === 'extras') {
      const symptoms = glosses.filter(g => g.category === 'symptom' && g.maps_to?.code);
      if (activeTab === 'extras') {
        onChange({ extraSymptoms: [...new Set([...extras, ...symptoms.map(g => g.maps_to!.code!)])]
          .filter(code => code !== data.chiefComplaintCode) });
      } else if (symptoms[0]) {
        const g = symptoms[0];
        onChange({ chiefComplaintCode: g.maps_to!.code!, chiefComplaintLabel: g.label_vi,
          extraSymptoms: extras.filter(code => code !== g.maps_to!.code),
          hasPain: g.maps_to!.code === 'PAIN' ? true : data.hasPain });
      }
    } else if (activeTab === 'pain_body') {
      onChange({ bodyRegions: [...new Set([...data.bodyRegions,
        ...glosses.filter(g => g.category === 'region' && g.maps_to?.code).map(g => g.maps_to!.code!)])] });
    } else {
      const number = glosses.find(g => ['severity', 'number'].includes(g.category) &&
        typeof g.maps_to?.value === 'number');
      if (number) {
        const value = number.maps_to!.value as number;
        onChange(activeTab === 'onset' ? { onsetValue: value } : { severity: value });
      }
    }
    setCameraOpen(false);
  };

  return (
    <div className={`w-full mx-auto space-y-5 ${showCamera ? '' : 'max-w-5xl'}`}>
      <h2 className="text-2xl font-bold text-ink">{vi.wizard.step2}</h2>
      {sentenceFlow && <p role="status" className="text-lg bg-canvas rounded-xl p-4">Đã đưa gợi ý vào bản nháp. Hãy bổ sung phần còn thiếu bằng Chạm; chọn Chưa rõ nếu chưa trả lời được. Bạn sẽ kiểm tra toàn phiếu trước khi xác nhận.</p>}
      {!intakeCamera && <div role="tablist" aria-label="Các phần triệu chứng" className="flex flex-wrap gap-3">
        {tabs.filter(tab => !['pain_scale', 'onset'].includes(tab.id) || data.hasPain === true)
          .map(tab => <button key={tab.id} type="button" role="tab"
            aria-selected={activeTab === tab.id} onClick={() => { setActiveTab(tab.id); setCameraOpen(false); }}
            className={`min-h-[64px] px-4 rounded-xl border-2 font-bold ${activeTab === tab.id ? 'bg-action text-white' : 'bg-paper text-ink'}`}>
            {tab.label}
          </button>)}
      </div>}

      <section aria-label={tabs.find(tab => tab.id === activeTab)?.label} className={`bg-paper border rounded-2xl space-y-5 ${showCamera ? 'p-1 sm:p-2' : 'p-5'}`}>
        <h3 className="text-2xl font-bold">{tabs.find(tab => tab.id === activeTab)?.label}</h3>
        {!showCamera && activeTab === 'complaint' && <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {CHIEF_COMPLAINTS.map(item => <button type="button" key={item.code}
            aria-pressed={data.chiefComplaintCode === item.code}
            onClick={() => onChange({ chiefComplaintCode: item.code, chiefComplaintLabel: item.label,
              extraSymptoms: extras.filter(code => code !== item.code),
              hasPain: item.code === 'PAIN' ? true : data.hasPain })}
            className={`min-h-[110px] rounded-2xl border-2 p-4 text-lg font-bold flex flex-col items-center gap-2 ${data.chiefComplaintCode === item.code ? 'border-action bg-action/10' : 'border-gray-200'}`}>
            {item.icon}{item.label}
          </button>)}
        </div>}

        {!intakeCamera && ((activeTab === 'complaint' && data.chiefComplaintCode && data.chiefComplaintCode !== 'PAIN') || activeTab === 'pain_body') &&
          <div className="space-y-3">
            <p className="text-xl font-bold">{vi.wizard.painQuestion}</p>
            <div className="flex flex-wrap gap-3">
              <Button variant={data.hasPain === true ? 'primary' : 'secondary'} onClick={() => onChange({ hasPain: true })}>{vi.intake.hasPain}</Button>
              <Button variant={data.hasPain === false ? 'primary' : 'secondary'} onClick={() => onChange({ hasPain: false, severity: null, bodyRegions: [], onsetValue: null })}>{vi.intake.noPain}</Button>
              <Button variant="secondary" onClick={() => onChange({ hasPain: null, severity: null, bodyRegions: [], onsetValue: null })}>{vi.intake.unknown}</Button>
            </div>
          </div>}

        {!showCamera && activeTab === 'pain_body' && isPainRelevant && data.hasPain === true && <>
          <BodyMap selectedRegions={data.bodyRegions}
            onToggleRegion={code => onChange({ bodyRegions: data.bodyRegions.includes(code) ? data.bodyRegions.filter(c => c !== code) : [...data.bodyRegions, code] })} />
          <Button variant="secondary" onClick={() => onChange({ bodyRegions: [] })}>Vị trí chưa rõ</Button>
        </>}

        {activeTab === 'pain_scale' && data.hasPain === true && <div className="space-y-4">
          <p>{data.severity === null ? vi.intake.unknown : `${data.severity}/10`}</p>
          {sentenceFlow && data.severity === null ? <div className="grid grid-cols-3 sm:grid-cols-6 gap-3" aria-label="Chọn mức đau">
            {Array.from({length:11},(_,value) => <Button key={value} variant="secondary" aria-label={`Mức đau ${value}`}
              onClick={() => onChange({severity:value})}>{value}/10</Button>)}
          </div> : <PainSlider value={data.severity ?? 5} onChange={severity => onChange({ severity })} />}
          <Button disabled={sentenceFlow && data.severity===null} onClick={() => onChange({ severity: data.severity ?? 5 })}>{vi.intake.accept}</Button>
          <Button variant="secondary" onClick={() => onChange({ severity: null })}>{vi.intake.unknown}</Button>
        </div>}

        {activeTab === 'onset' && data.hasPain === true && <div className="space-y-4">
          <Clock className="w-8 h-8" />
          <div className="grid grid-cols-2 gap-3">
            {[1, 2].map(value => <Button key={value} variant="secondary" onClick={() => onChange({ onsetValue: value, onsetUnit: 'hour' })}>{value} {vi.intake.units.hour}</Button>)}
          </div>
          <label className="block text-lg">{vi.intake.onset}
            <input aria-label="Số lượng thời gian" type="number" min={0} max={60} value={data.onsetValue ?? ''}
              onChange={event => onChange({ onsetValue: event.target.value === '' ? null : Math.max(0, Number(event.target.value)) })}
              className="block min-h-[64px] w-28 p-3 border-2 rounded-xl" />
          </label>
          <div className="flex flex-wrap gap-3">{ONSET_UNITS.map(item => <Button key={item.unit}
            variant={data.onsetUnit === item.unit ? 'primary' : 'secondary'} onClick={() => onChange({ onsetUnit: item.unit })}>{item.label}</Button>)}</div>
          <Button variant="secondary" onClick={() => onChange({ onsetValue: null })}>{vi.intake.unknown}</Button>
        </div>}

        {!showCamera && activeTab === 'extras' && <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {CHIEF_COMPLAINTS.filter(item => item.code !== data.chiefComplaintCode && !['OTHER', 'CHECKUP', 'PAIN'].includes(item.code))
            .map(item => <button type="button" key={item.code} aria-pressed={extras.includes(item.code)}
              onClick={() => onChange({ extraSymptoms: extras.includes(item.code) ? extras.filter(code => code !== item.code) : [...extras, item.code] })}
              className={`min-h-[100px] rounded-xl border-2 p-4 flex flex-col items-center gap-2 font-bold ${extras.includes(item.code) ? 'border-action bg-action/10' : 'border-gray-200'}`}>
              {item.icon}{item.label}
            </button>)}
        </div>}

        {cameraSupported && (showCamera ?
          <VSLCameraView key={activeTab} contextStep={contextStep} onApplyGlosses={applyGlosses}
            onApplyIntakeSuggestion={applySentence} connected={connected}
            draftKey={JSON.stringify([data, frameKey])}
            replacementNotice={intakeCamera && data.chiefComplaintCode ?
              `Bản nháp hiện có: ${data.chiefComplaintLabel || data.chiefComplaintCode}${data.bodyRegions.length ? ' — ' + data.bodyRegions.map(code => SENTENCE_REGIONS[code as keyof typeof SENTENCE_REGIONS] || code).join(', ') : ''}. Dùng câu mới sẽ thay lý do khám, tình trạng đau và vị trí; mức đau/thời gian cũ được xóa nếu các thông tin này thay đổi.` : undefined}
            onSwitchToTouchMode={() => { setCameraOpen(false); onSwitchMode?.('touch'); }} /> :
          <Button variant="secondary" disabled={['pain_body', 'pain_scale', 'onset'].includes(activeTab) && data.hasPain !== true}
            onClick={() => setCameraOpen(true)}>{vi.intake.cameraButton}</Button>)}
        <p className="text-sm text-mute">{intakeCamera ? 'Một câu → một gợi ý đầy đủ → bạn kiểm tra và dùng hoặc sửa. Chưa xác nhận toàn phiếu ở bước này.' : vi.intake.contextHint}</p>
      </section>

      <p className="text-lg font-bold">{vi.intake.main} — {data.chiefComplaintLabel || vi.intake.unknown}</p>
      <div className="flex flex-wrap justify-between gap-3">
        <Button variant="secondary" onClick={onBack}>{vi.common.back}</Button>
        <Button variant="primary" disabled={!data.chiefComplaintCode || intakeCamera} onClick={continueDetails}>{vi.common.next}</Button>
      </div>
    </div>
  );
};

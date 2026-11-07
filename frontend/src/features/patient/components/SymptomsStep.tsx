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

export interface SymptomsData {
  chiefComplaintCode: string | null;
  chiefComplaintLabel: string | null;
  hasPain: boolean | null;
  severity: number | null;
  bodyRegions: string[];
  onsetValue: number | null;
  onsetUnit: OnsetUnit | null;
}

export interface SymptomsStepProps {
  data: SymptomsData;
  selectedMode?: ModalityType;
  onChange: (updated: Partial<SymptomsData>) => void;
  onBack: () => void;
  onNext: () => void;
  onSwitchMode?: (mode: ModalityType) => void;
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

export const SymptomsStep: React.FC<SymptomsStepProps> = ({
  data,
  selectedMode = 'touch',
  onChange,
  onBack,
  onNext,
  onSwitchMode,
}) => {
  const [activeTab, setActiveTab] = useState<'complaint' | 'pain_body' | 'pain_scale' | 'onset'>(
    data.chiefComplaintCode ? 'pain_body' : 'complaint'
  );

  const handleApplyVSLGlosses = (glosses: RecognizedGloss[]) => {
    let complaintCode = data.chiefComplaintCode;
    let complaintLabel = data.chiefComplaintLabel;
    let hasPain = data.hasPain;
    const bodyRegions = [...data.bodyRegions];
    let severity = data.severity;
    let onsetValue = data.onsetValue;
    let onsetUnit = data.onsetUnit;

    glosses.forEach((g) => {
      if (g.category === 'symptom' && g.maps_to?.field === 'chief_complaint') {
        complaintCode = g.maps_to.code || 'PAIN';
        complaintLabel = g.label_vi;
        if (complaintCode === 'PAIN') hasPain = true;
      }
      if (g.category === 'region' && g.maps_to?.code) {
        if (!bodyRegions.includes(g.maps_to.code)) {
          bodyRegions.push(g.maps_to.code);
        }
        hasPain = true;
      }
      if (g.category === 'severity' && typeof g.maps_to?.value === 'number') {
        severity = g.maps_to.value;
      }
      if (g.category === 'number' && typeof g.maps_to?.value === 'number') {
        onsetValue = g.maps_to.value;
      }
      if (g.category === 'time_unit' && g.maps_to?.unit) {
        onsetUnit = g.maps_to.unit as OnsetUnit;
      }
      if (g.category === 'time' && g.maps_to) {
        onsetValue = (g.maps_to.value as number) || 0;
        onsetUnit = (g.maps_to.unit as OnsetUnit) || 'day';
      }
    });

    onChange({
      chiefComplaintCode: complaintCode,
      chiefComplaintLabel: complaintLabel,
      hasPain: hasPain ?? (complaintCode === 'PAIN'),
      bodyRegions,
      severity,
      onsetValue,
      onsetUnit,
    });
  };

  const handleSelectComplaint = (code: string, label: string) => {
    const isPain = code === 'PAIN';
    onChange({
      chiefComplaintCode: code,
      chiefComplaintLabel: label,
      hasPain: isPain ? true : data.hasPain,
    });
    if (isPain || data.hasPain) {
      setActiveTab('pain_body');
    }
  };

  const handleToggleRegion = (code: string) => {
    const exists = data.bodyRegions.includes(code);
    const updated = exists
      ? data.bodyRegions.filter((c) => c !== code)
      : [...data.bodyRegions, code];
    onChange({ bodyRegions: updated, hasPain: true });
  };

  const isPainRelevant = data.chiefComplaintCode === 'PAIN' || data.hasPain === true;
  const isVslMode = selectedMode === 'vsl_gloss';
  const canProceed = Boolean(data.chiefComplaintCode);

  return (
    <div className={`flex flex-col w-full mx-auto ${isVslMode ? 'max-w-full space-y-2' : 'max-w-4xl space-y-6'}`}>
      {isVslMode ? (
        <div className="flex items-center justify-between px-1">
          <div>
            <h2 className="text-xl md:text-2xl font-black text-ink">
              {vi.wizard.step2}
            </h2>
            <p className="text-xs text-mute">
              Dùng ngôn ngữ ký hiệu hoặc cử chỉ tự nhiên trước camera để khai báo triệu chứng.
            </p>
          </div>
          <Button
            variant="secondary"
            onClick={onBack}
            className="!min-h-[40px] !py-1.5 !px-4 text-xs font-bold rounded-xl"
          >
            {vi.common.back}
          </Button>
        </div>
      ) : (
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-ink mb-2">
            {vi.wizard.step2}
          </h2>
          <p className="text-mute text-base">
            Chọn lý do khiến bạn cảm thấy khó chịu nhất hôm nay.
          </p>
        </div>
      )}

      {/* Chế độ VSL Camera: Giao diện Studio 2 cột chuyên dụng */}
      {isVslMode ? (
        <div className="w-full">
          <VSLCameraView
            onApplyGlosses={(glosses) => {
              handleApplyVSLGlosses(glosses);
              onNext();
            }}
            onSwitchToTouchMode={() => onSwitchMode?.('touch')}
          />
        </div>
      ) : (
        <>
          {/* Tabs chuyển đổi giữa các phần triệu chứng (Dành riêng cho Chế độ Chạm) */}
          <div
            role="tablist"
            aria-label="Các phần triệu chứng"
            className="flex p-1 bg-canvas rounded-2xl border border-gray-200 gap-1 overflow-x-auto"
          >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'complaint'}
          onClick={() => setActiveTab('complaint')}
          className={`flex-1 py-3 px-4 rounded-xl font-bold text-base transition-colors min-h-[48px] cursor-pointer whitespace-nowrap ${
            activeTab === 'complaint'
              ? 'bg-paper text-action shadow-sm border border-gray-200'
              : 'text-mute hover:text-ink'
          }`}
        >
          1. Lý do khám {data.chiefComplaintCode && '✓'}
        </button>

        {isPainRelevant && (
          <>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'pain_body'}
              onClick={() => setActiveTab('pain_body')}
              className={`flex-1 py-3 px-4 rounded-xl font-bold text-base transition-colors min-h-[48px] cursor-pointer whitespace-nowrap ${
                activeTab === 'pain_body'
                  ? 'bg-paper text-action shadow-sm border border-gray-200'
                  : 'text-mute hover:text-ink'
              }`}
            >
              2. Vị trí đau ({data.bodyRegions.length})
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'pain_scale'}
              onClick={() => setActiveTab('pain_scale')}
              className={`flex-1 py-3 px-4 rounded-xl font-bold text-base transition-colors min-h-[48px] cursor-pointer whitespace-nowrap ${
                activeTab === 'pain_scale'
                  ? 'bg-paper text-action shadow-sm border border-gray-200'
                  : 'text-mute hover:text-ink'
              }`}
            >
              3. Mức đau {data.severity !== null && `(${data.severity}/10)`}
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'onset'}
              onClick={() => setActiveTab('onset')}
              className={`flex-1 py-3 px-4 rounded-xl font-bold text-base transition-colors min-h-[48px] cursor-pointer whitespace-nowrap ${
                activeTab === 'onset'
                  ? 'bg-paper text-action shadow-sm border border-gray-200'
                  : 'text-mute hover:text-ink'
              }`}
            >
              4. Thời gian {data.onsetValue && `(${data.onsetValue})`}
            </button>
          </>
        )}
      </div>

      {/* Nội dung Tab 1: Lưới lý do khám */}
      {activeTab === 'complaint' && (
        <section aria-label="Chọn lý do khám" className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {CHIEF_COMPLAINTS.map((item) => {
              const isSelected = data.chiefComplaintCode === item.code;
              return (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => handleSelectComplaint(item.code, item.label)}
                  className={`flex flex-col items-center justify-center p-5 rounded-2xl border-2 transition-all cursor-pointer min-h-[120px] select-none text-center ${
                    isSelected
                      ? 'border-action bg-action/10 text-action shadow-sm'
                      : 'border-gray-200 bg-paper text-ink hover:border-action/40 hover:bg-canvas'
                  }`}
                  aria-pressed={isSelected}
                >
                  <div className="mb-2 text-action">{item.icon}</div>
                  <span className="font-bold text-lg leading-tight">{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Câu hỏi có đau không nếu lý do không phải là PAIN */}
          {data.chiefComplaintCode && data.chiefComplaintCode !== 'PAIN' && (
            <div className="p-6 bg-paper rounded-2xl border border-gray-200 mt-6 text-center">
              <span className="block font-bold text-lg text-ink mb-4">
                {vi.wizard.painQuestion}
              </span>
              <div className="flex justify-center gap-4">
                <Button
                  variant={data.hasPain === true ? 'primary' : 'secondary'}
                  onClick={() => {
                    onChange({ hasPain: true });
                    setActiveTab('pain_body');
                  }}
                  className="min-w-[140px]"
                >
                  Có đau
                </Button>
                <Button
                  variant={data.hasPain === false ? 'primary' : 'secondary'}
                  onClick={() => onChange({ hasPain: false, bodyRegions: [], severity: 0 })}
                  className="min-w-[140px]"
                >
                  Không đau
                </Button>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Nội dung Tab 2: Sơ đồ cơ thể BodyMap */}
      {activeTab === 'pain_body' && (
        <section aria-label="Chọn vị trí cơ thể bị đau">
          <div className="bg-paper p-6 rounded-2xl border border-gray-200">
            <BodyMap
              selectedRegions={data.bodyRegions}
              onToggleRegion={handleToggleRegion}
            />
            <div className="mt-6 flex justify-end">
              <Button variant="secondary" onClick={() => setActiveTab('pain_scale')}>
                Tiếp tục sang mức đau →
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Nội dung Tab 3: Thanh mức đau PainSlider */}
      {activeTab === 'pain_scale' && (
        <section aria-label="Chọn mức độ đau">
          <div className="bg-paper p-8 rounded-2xl border border-gray-200">
            <PainSlider
              value={data.severity ?? 5}
              onChange={(val) => onChange({ severity: val, hasPain: true })}
            />
            <div className="mt-8 flex justify-end">
              <Button variant="secondary" onClick={() => setActiveTab('onset')}>
                Tiếp tục sang thời gian bắt đầu →
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Nội dung Tab 4: Thời gian bắt đầu */}
      {activeTab === 'onset' && (
        <section aria-label="Chọn thời gian bắt đầu cơn đau">
          <div className="bg-paper p-8 rounded-2xl border border-gray-200 max-w-xl mx-auto space-y-6">
            <div className="text-center">
              <Clock className="w-10 h-10 text-action mx-auto mb-2" />
              <span className="block text-2xl font-bold text-ink">
                {vi.wizard.painOnsetPrompt}
              </span>
            </div>

            {/* Quick chips */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { val: 1, unit: 'hour' as OnsetUnit, label: '1 giờ trước' },
                { val: 2, unit: 'hour' as OnsetUnit, label: '2 giờ trước' },
                { val: 1, unit: 'day' as OnsetUnit, label: 'Từ hôm qua' },
                { val: 3, unit: 'day' as OnsetUnit, label: 'Vài ngày trước' },
              ].map((chip) => {
                const isMatch = data.onsetValue === chip.val && data.onsetUnit === chip.unit;
                return (
                  <button
                    key={chip.label}
                    type="button"
                    onClick={() => onChange({ onsetValue: chip.val, onsetUnit: chip.unit })}
                    className={`p-3 rounded-xl border-2 font-bold text-base transition-colors min-h-[56px] cursor-pointer select-none ${
                      isMatch
                        ? 'border-action bg-action text-white'
                        : 'border-gray-200 bg-canvas hover:bg-gray-200 text-ink'
                    }`}
                  >
                    {chip.label}
                  </button>
                );
              })}
            </div>

            {/* Tùy chỉnh số lượng + Đơn vị */}
            <div className="pt-4 border-t border-gray-200 space-y-3">
              <span className="block text-sm font-semibold text-mute">Hoặc tùy chọn:</span>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={data.onsetValue || ''}
                  placeholder="Số"
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    onChange({ onsetValue: isNaN(val) ? null : val });
                  }}
                  className="w-24 px-4 py-3 border-2 border-gray-300 rounded-xl text-center text-xl font-bold focus:border-action outline-none min-h-[56px]"
                  aria-label="Số lượng thời gian"
                />

                <div className="flex-1 flex gap-1.5 flex-wrap">
                  {ONSET_UNITS.map((u) => (
                    <button
                      key={u.unit}
                      type="button"
                      onClick={() => onChange({ onsetUnit: u.unit })}
                      className={`px-3 py-2 rounded-xl border-2 font-bold text-sm min-h-[48px] cursor-pointer transition-colors ${
                        data.onsetUnit === u.unit
                          ? 'border-action bg-action text-white'
                          : 'border-gray-200 bg-canvas text-ink hover:bg-gray-200'
                      }`}
                    >
                      {u.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Thanh tóm tắt nhỏ ở dưới */}
      <div className="p-4 bg-paper rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <span className="font-bold text-mute text-sm">Bạn đã chọn:</span>
          <span className="font-bold text-ink text-base">
            {data.chiefComplaintLabel || 'Chưa chọn lý do'}
          </span>
          {data.hasPain && data.bodyRegions.length > 0 && (
            <span className="text-action text-sm font-semibold">
              · Đau ở {data.bodyRegions.length} vị trí (mức {data.severity ?? 5}/10)
            </span>
          )}
        </div>

        {/* Nút điều hướng Điều hướng Back & Next */}
        <div className="flex gap-3">
          <Button variant="secondary" onClick={onBack}>
            {vi.common.back}
          </Button>
          <Button variant="primary" onClick={onNext} disabled={!canProceed}>
            {vi.common.next}
          </Button>
        </div>
      </div>
        </>
      )}
    </div>
  );
};

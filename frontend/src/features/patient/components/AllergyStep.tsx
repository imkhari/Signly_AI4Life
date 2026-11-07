import React, { useState } from 'react';
import { Check, HelpCircle, Pill, Plus, X } from 'lucide-react';
import { Button } from '../../../ui/Button';
import { AllergyCategory, AllergyItem } from '../../../types';
import { vi } from '../../../i18n/vi';

export interface AllergyData {
  hasAllergy: boolean | 'unsure' | null;
  items: AllergyItem[];
}

export interface AllergyStepProps {
  data: AllergyData;
  onChange: (updated: Partial<AllergyData>) => void;
  onBack: () => void;
  onNext: () => void;
}

const COMMON_DRUGS = [
  'Panadol / Paracetamol',
  'Penicillin',
  'Amoxicillin',
  'Aspirin',
  'Kháng sinh (Cephalosporin)',
  'Ibuprofen',
];

const COMMON_FOODS = ['Hải sản (Tôm, Cua)', 'Đậu phộng / Lạc', 'Trứng gà', 'Sữa bò'];

export const AllergyStep: React.FC<AllergyStepProps> = ({
  data,
  onChange,
  onBack,
  onNext,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<AllergyCategory>('drug');
  const [customName, setCustomName] = useState('');

  const handleSelectHasAllergy = (val: boolean | 'unsure') => {
    onChange({
      hasAllergy: val,
      items: val === true ? data.items : [],
    });
  };

  const handleAddItem = (name: string, category: AllergyCategory) => {
    if (!name.trim()) return;
    const exists = data.items.some((i) => i.name.toLowerCase() === name.trim().toLowerCase());
    if (!exists) {
      onChange({
        items: [...data.items, { name: name.trim(), category }],
        hasAllergy: true,
      });
    }
    setCustomName('');
  };

  const handleRemoveItem = (index: number) => {
    const updated = data.items.filter((_, idx) => idx !== index);
    onChange({ items: updated });
  };

  const canProceed = data.hasAllergy !== null;

  return (
    <div className="flex flex-col w-full max-w-3xl mx-auto space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-extrabold text-ink mb-2">
          {vi.wizard.step3}
        </h2>
        <p className="text-mute text-base">
          {vi.wizard.allergyQuestion}
        </p>
      </div>

      {/* 3 Nút lớn: Không · Có · Không chắc */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          type="button"
          onClick={() => handleSelectHasAllergy(false)}
          className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 font-bold text-2xl transition-all cursor-pointer min-h-[120px] select-none ${
            data.hasAllergy === false
              ? 'border-ok bg-ok-bg text-ok shadow-sm'
              : 'border-gray-200 bg-paper text-ink hover:border-ok/40 hover:bg-canvas'
          }`}
          aria-pressed={data.hasAllergy === false}
        >
          <div className="w-10 h-10 rounded-full bg-ok/10 text-ok flex items-center justify-center mb-2">
            <Check className="w-6 h-6" />
          </div>
          <span>Không dị ứng</span>
        </button>

        <button
          type="button"
          onClick={() => handleSelectHasAllergy(true)}
          className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 font-bold text-2xl transition-all cursor-pointer min-h-[120px] select-none ${
            data.hasAllergy === true
              ? 'border-danger bg-danger-bg text-danger shadow-sm'
              : 'border-gray-200 bg-paper text-ink hover:border-danger/40 hover:bg-canvas'
          }`}
          aria-pressed={data.hasAllergy === true}
        >
          <div className="w-10 h-10 rounded-full bg-danger/10 text-danger flex items-center justify-center mb-2">
            <Pill className="w-6 h-6" />
          </div>
          <span>Có dị ứng</span>
        </button>

        <button
          type="button"
          onClick={() => handleSelectHasAllergy('unsure')}
          className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 font-bold text-2xl transition-all cursor-pointer min-h-[120px] select-none ${
            data.hasAllergy === 'unsure'
              ? 'border-warn bg-warn-bg text-warn shadow-sm'
              : 'border-gray-200 bg-paper text-ink hover:border-warn/40 hover:bg-canvas'
          }`}
          aria-pressed={data.hasAllergy === 'unsure'}
        >
          <div className="w-10 h-10 rounded-full bg-warn/10 text-warn flex items-center justify-center mb-2">
            <HelpCircle className="w-6 h-6" />
          </div>
          <span>Không chắc chắn</span>
        </button>
      </div>

      {/* Nếu chọn CÓ: Chọn nhóm và tên dị ứng */}
      {data.hasAllergy === true && (
        <div className="bg-paper p-6 rounded-2xl border border-gray-200 space-y-6">
          <div>
            <span className="block text-sm font-bold text-ink mb-2">Chọn nhóm dị ứng:</span>
            <div className="flex gap-2">
              {[
                { cat: 'drug' as AllergyCategory, label: 'Thuốc' },
                { cat: 'food' as AllergyCategory, label: 'Thức ăn' },
                { cat: 'other' as AllergyCategory, label: 'Khác' },
              ].map((c) => (
                <button
                  key={c.cat}
                  type="button"
                  onClick={() => setSelectedCategory(c.cat)}
                  className={`px-4 py-2 rounded-xl font-bold text-base transition-colors min-h-[48px] cursor-pointer ${
                    selectedCategory === c.cat
                      ? 'bg-action text-white'
                      : 'bg-canvas text-ink hover:bg-gray-200'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Gợi ý thuốc/thức ăn phổ biến */}
          <div>
            <span className="block text-sm font-semibold text-mute mb-2">
              Chạm nhanh các loại phổ biến:
            </span>
            <div className="flex flex-wrap gap-2">
              {(selectedCategory === 'drug' ? COMMON_DRUGS : COMMON_FOODS).map((name) => {
                const isAdded = data.items.some((i) => i.name === name);
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => handleAddItem(name, selectedCategory)}
                    disabled={isAdded}
                    className={`px-3 py-2 rounded-xl border-2 font-semibold text-sm transition-colors cursor-pointer select-none ${
                      isAdded
                        ? 'border-action bg-action/10 text-action opacity-60'
                        : 'border-gray-200 bg-canvas hover:bg-gray-200 text-ink'
                    }`}
                  >
                    + {name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Ô nhập tên tùy chỉnh */}
          <div className="flex gap-2">
            <input
              type="text"
              value={customName}
              placeholder={vi.wizard.allergyDrugPlaceholder}
              onChange={(e) => setCustomName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddItem(customName, selectedCategory);
                }
              }}
              className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl text-base focus:border-action outline-none min-h-[56px]"
            />
            <Button
              variant="secondary"
              onClick={() => handleAddItem(customName, selectedCategory)}
              disabled={!customName.trim()}
              className="min-h-[56px] px-4"
              icon={<Plus className="w-5 h-5" />}
            >
              Thêm
            </Button>
          </div>

          {/* Danh sách đã thêm */}
          {data.items.length > 0 && (
            <div className="pt-4 border-t border-gray-200">
              <span className="block text-sm font-bold text-ink mb-2">
                Đã thêm ({data.items.length}):
              </span>
              <div className="flex flex-wrap gap-2">
                {data.items.map((it, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-danger-bg text-danger border border-danger/40 rounded-lg font-bold text-sm"
                  >
                    <span>{it.name}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="hover:text-ink cursor-pointer"
                      aria-label={`Xóa dị ứng ${it.name}`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Điều hướng */}
      <div className="flex justify-between items-center pt-4">
        <Button variant="secondary" onClick={onBack}>
          {vi.common.back}
        </Button>
        <Button variant="primary" onClick={onNext} disabled={!canProceed}>
          {vi.common.next}
        </Button>
      </div>
    </div>
  );
};

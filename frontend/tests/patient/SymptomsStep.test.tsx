import { render, screen, fireEvent } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { SymptomsStep, type SymptomsData, type SymptomTab } from '../../src/features/patient/components/SymptomsStep';

vi.mock('../../src/features/patient/components/VSLCameraView', () => ({
  VSLCameraView: ({ onApplyGlosses }: { onApplyGlosses: (values: unknown[]) => void }) =>
    <button onClick={() => onApplyGlosses([
      { category: 'symptom', label_vi: 'Ho', maps_to: { field: 'chief_complaint', code: 'COUGH' } },
      { category: 'region', maps_to: { code: 'ABDOMEN_UPPER' } },
      { category: 'severity', maps_to: { value: 2 } },
      { category: 'modifier', maps_to: { value: false } },
    ])}>Apply synthetic camera result</button>,
}));

const data: SymptomsData = {
  chiefComplaintCode: 'PAIN', chiefComplaintLabel: 'Đau', hasPain: true,
  severity: 3, bodyRegions: [], onsetValue: null, onsetUnit: 'hour', extraSymptoms: [],
};

it('adds a symptom without overwriting the main complaint', () => {
  const change = vi.fn();
  render(<SymptomsStep data={data} initialTab="extras" selectedMode="vsl_gloss"
    onChange={change} onBack={() => {}} onNext={() => {}} />);
  fireEvent.click(screen.getByText('Apply synthetic camera result'));
  expect(change).toHaveBeenCalledWith({ extraSymptoms: ['COUGH'] });
});

it.each<[SymptomTab, Record<string, number>]>([
  ['pain_scale', { severity: 2 }], ['onset', { onsetValue: 2 }],
])('assigns a number only to the active question %s', (initialTab, expected) => {
  const change = vi.fn();
  render(<SymptomsStep data={data} initialTab={initialTab} selectedMode="vsl_gloss"
    onChange={change} onBack={() => {}} onNext={() => {}} />);
  fireEvent.click(screen.getByText('Apply synthetic camera result'));
  expect(change).toHaveBeenCalledWith(expected);
});

it('requires an explicit pain answer before accepting a region', () => {
  const change = vi.fn();
  render(<SymptomsStep data={{ ...data, hasPain: null }} initialTab="pain_body"
    onChange={change} onBack={() => {}} onNext={() => {}} />);
  expect(screen.queryByText('Apply synthetic camera result')).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Thử camera cho câu hỏi này' })).toBeDisabled();
  expect(change).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: /^Có đau$/ }));
  expect(change).toHaveBeenCalledWith({ hasPain: true });
});

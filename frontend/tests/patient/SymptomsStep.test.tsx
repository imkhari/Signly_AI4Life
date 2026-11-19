import { render, screen, fireEvent } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { SymptomsStep, type SymptomsData, type SymptomTab } from '../../src/features/patient/components/SymptomsStep';

vi.mock('../../src/features/patient/components/VSLCameraView', () => ({
  VSLCameraView: ({ onApplyGlosses, onSwitchToTouchMode }: { onApplyGlosses: (values: unknown[]) => void; onSwitchToTouchMode: () => void }) =>
    <><button onClick={() => onApplyGlosses([
      { category: 'symptom', label_vi: 'Ho', maps_to: { field: 'chief_complaint', code: 'COUGH' } },
      { category: 'region', maps_to: { code: 'ABDOMEN_UPPER' } },
      { category: 'severity', maps_to: { value: 2 } },
      { category: 'modifier', maps_to: { value: false } },
    ])}>Apply synthetic camera result</button><button onClick={onSwitchToTouchMode}>Chuyển sang Chạm</button></>,
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

it.each<SymptomTab>(['pain_scale', 'onset'])('keeps camera unavailable for %s', initialTab => {
  render(<SymptomsStep data={data} initialTab={initialTab} selectedMode="vsl_gloss"
    onChange={() => {}} onBack={() => {}} onNext={() => {}} />);
  expect(screen.queryByText('Apply synthetic camera result')).not.toBeInTheDocument();
  expect(screen.queryByRole('button', {name:'Thử camera cho câu hỏi này'})).not.toBeInTheDocument();
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

it('puts camera in focus and restores manual choices on touch switch', () => {
  render(<SymptomsStep data={data} selectedMode="vsl_gloss" onChange={() => {}}
    onBack={() => {}} onNext={() => {}} />);
  expect(screen.queryByRole('button',{name:'Đau / Nhức'})).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button',{name:'Chuyển sang Chạm'}));
  expect(screen.getByRole('button',{name:'Đau / Nhức'})).toBeVisible();
});

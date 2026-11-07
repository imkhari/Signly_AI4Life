import React from 'react';
import { Check } from 'lucide-react';

export interface StepItem {
  id: string;
  label: string;
}

export interface StepProgressProps {
  steps: StepItem[];
  currentStepIndex: number;
  className?: string;
}

export const StepProgress: React.FC<StepProgressProps> = ({
  steps,
  currentStepIndex,
  className = '',
}) => {
  return (
    <nav aria-label="Tiến độ các bước khai báo" className={`w-full ${className}`}>
      <ol className="flex items-center justify-between w-full">
        {steps.map((step, idx) => {
          const isCompleted = idx < currentStepIndex;
          const isCurrent = idx === currentStepIndex;

          return (
            <li
              key={step.id}
              className={`flex-1 flex flex-col items-center relative ${
                idx !== steps.length - 1
                  ? "after:content-[''] after:w-full after:h-1 after:top-6 after:left-1/2 after:absolute after:-z-10"
                  : ''
              } ${
                isCompleted
                  ? 'after:bg-action'
                  : 'after:bg-gray-200'
              }`}
            >
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg border-2 transition-all ${
                  isCompleted
                    ? 'bg-action border-action text-white'
                    : isCurrent
                      ? 'bg-paper border-action text-action ring-4 ring-action/20'
                      : 'bg-paper border-gray-300 text-mute'
                }`}
                aria-current={isCurrent ? 'step' : undefined}
              >
                {isCompleted ? <Check className="w-6 h-6" /> : <span>{idx + 1}</span>}
              </div>
              <span
                className={`mt-2 text-sm md:text-base font-semibold text-center ${
                  isCurrent ? 'text-action' : isCompleted ? 'text-ink' : 'text-mute'
                }`}
              >
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};


import React from 'react';
import { IconCheck } from '@tabler/icons-react';

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
                  ? "after:content-[''] after:w-full after:h-0.5 after:top-4 after:left-1/2 after:absolute after:-z-10"
                  : ''
              } ${
                isCompleted
                  ? 'after:bg-action'
                  : 'after:bg-gray-200'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm border-2 transition-all ${
                  isCompleted
                    ? 'bg-action border-action text-white shadow-2xs'
                    : isCurrent
                      ? 'bg-paper border-action text-action ring-2 ring-action/20 shadow-2xs'
                      : 'bg-paper border-gray-300 text-mute'
                }`}
                aria-current={isCurrent ? 'step' : undefined}
              >
                {isCompleted ? <IconCheck className="w-4 h-4" stroke={3} /> : <span>{idx + 1}</span>}
              </div>
              <span
                className={`mt-1 text-xs font-semibold text-center truncate max-w-[90px] sm:max-w-none ${
                  isCurrent ? 'text-action font-bold' : isCompleted ? 'text-ink' : 'text-mute'
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



import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, HelpCircle } from 'lucide-react';
import { PairingScreen } from './components/PairingScreen';
import { ChooseModeStep } from './components/ChooseModeStep';
import { SymptomsStep, type SymptomTab } from './components/SymptomsStep';
import { AllergyStep } from './components/AllergyStep';
import { ConfirmStep } from './components/ConfirmStep';
import { WaitingStep } from './components/WaitingStep';
import { NurseQuestionModal } from './components/NurseQuestionModal';
import { useWizard } from './hooks/useWizard';
import { useSession } from '../../state/SessionContext';
import { useSessionSocket } from '../../hooks/useSessionSocket';
import { useIdleReset } from '../../hooks/useIdleReset';
import { socketClient } from '../../services/ws/socketClient';
import { A11yControls } from '../../ui/A11yControls';
import { ConnectionBadge } from '../../ui/ConnectionBadge';
import { StepProgress } from '../../ui/StepProgress';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import { NurseQuestionPayload, InputUpdatedServerPayload } from '../../types';
import { vi } from '../../i18n/vi';

export const PatientPage: React.FC = () => {
  const { state } = useSession();
  const {
    socketStatus,
    socketError,
    sendInput,
    requestSummary,
    confirmPatient,
    requestInterpreter,
    resetSession,
  } = useSessionSocket();

  const {
    step,
    draft,
    updateMode,
    updateSymptoms,
    updateAllergy,
    nextStep,
    prevStep,
    goToStep,
    flushInput,
    resetWizard,
    receiveFrame,
  } = useWizard(sendInput);

  const [editTab, setEditTab] = useState<SymptomTab>('complaint');
  const [isInterpreterModalOpen, setIsInterpreterModalOpen] = useState(false);
  const [nurseQuestion, setNurseQuestion] = useState<NurseQuestionPayload | null>(null);

  // Lắng nghe câu hỏi bổ sung từ y tá
  useEffect(() => {
    const unsub = socketClient.on<NurseQuestionPayload>('NURSE_QUESTION', (payload) => {
      setNurseQuestion(payload);
    });
    const unsubAnswer = socketClient.on<InputUpdatedServerPayload>('INPUT_UPDATED', (payload) => {
      if (payload.step === 'nurse_reply') {
        receiveFrame(payload.frame);
        setNurseQuestion(null);
        if (step === 4) requestSummary();
        if (step === 5) goToStep(4);
      }
    });
    return () => { unsub(); unsubAnswer(); };
  }, [receiveFrame, step, requestSummary, goToStep]);

  // Idle reset: tự động kết thúc sau 10 phút, cảnh báo trước 60 giây
  const { showWarning: showIdleWarning, secondsRemaining, dismissWarning } = useIdleReset({
    idleTimeoutMs: 600000,
    warningDurationMs: 60000,
    onTimeout: () => resetSession('timeout'),
    enabled: Boolean(state.sessionId),
  });

  // Khi chuyển sang Bước 4 (Xác nhận), tự động gọi backend tóm tắt LLM
  useEffect(() => {
    if (step === 4 && socketStatus === 'connected') {
      if (flushInput()) requestSummary();
    }
  }, [step, requestSummary, flushInput, socketStatus]);

  useEffect(() => {
    if (!state.sessionId) resetWizard();
  }, [state.sessionId, resetWizard]);

  useEffect(() => {
    if (step === 4 && (state.status === 'patient_confirmed' || state.status === 'nurse_verified')) {
      goToStep(5);
    }
  }, [step, state.status, goToStep]);

  const stepsList = [
    { id: '1', label: 'Cách nói' },
    { id: '2', label: 'Triệu chứng' },
    { id: '3', label: 'Dị ứng' },
    { id: '4', label: 'Xác nhận' },
  ];

  const handleCallInterpreter = (urgent: boolean = false) => {
    requestInterpreter(urgent ? 'emergency_flag' : 'patient_request', urgent ? 'urgent' : 'normal');
    setIsInterpreterModalOpen(true);
  };

  const handleNurseAnswer = (ans: string) => {
    if (nurseQuestion) {
      if (!flushInput() || socketStatus !== 'connected') return;
      const value = ans === 'Có' ? true : ans === 'Không' ? false : 'unsure';
      sendInput('nurse_reply', {
        allergy: { has_allergy: value, items: value === true ? draft.allergy.items : [] },
      }, 'touch', undefined, nurseQuestion.question_id);
    }
  };

  return (
    <div className="patient-shell min-h-screen bg-canvas flex flex-col">
      {/* Header điều hướng Kiosk */}
      <header className="bg-paper border-b border-gray-200 px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-sm sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="p-2 rounded-xl text-mute hover:bg-canvas transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
            aria-label="Về màn hình chọn vai trò"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-ink">{vi.app.title}</h1>
            <span className="text-xs text-mute hidden sm:inline">{vi.app.disclaimer}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <>{state.sessionId ? <ConnectionBadge status={socketStatus} /> : <span className="text-sm font-semibold text-mute">{vi.presentation.unpaired}</span>}</>
          <A11yControls onCallHelp={() => handleCallInterpreter(false)} />
        </div>
      </header>

      {/* Nội dung chính */}
      <main lang="vi"
        className={`flex-1 w-full mx-auto flex flex-col justify-start ${
          step === 2 && draft.selectedMode === 'vsl_gloss'
            ? 'max-w-[1360px] px-3 py-2 md:px-6 md:py-3'
            : 'max-w-5xl p-4 md:p-8'
        }`}
      >
        {!state.sessionId ? (
          <PairingScreen onPaired={() => goToStep(1)} />
        ) : (
          <div className={`w-full ${step === 2 && draft.selectedMode === 'vsl_gloss' ? 'space-y-3' : 'space-y-8'}`}>
            {/* Thanh tiến độ wizard (chỉ hiện từ bước 1 đến 4) */}
            {step >= 1 && step <= 4 && (
              <div className="bg-paper rounded-xl border border-gray-200 py-2 px-3 sm:px-4 shadow-2xs">
                <StepProgress steps={stepsList} currentStepIndex={step - 1} />
              </div>
            )}

            {/* Bước 1: Chọn phương thức */}
            {step === 1 && (
              <ChooseModeStep
                selectedMode={draft.selectedMode}
                onSelectMode={updateMode}
                onNext={nextStep}
              />
            )}

            {/* Bước 2: Triệu chứng */}
            {step === 2 && (
              <SymptomsStep
                initialTab={editTab}
                data={draft.symptoms}
                selectedMode={draft.selectedMode}
                onChange={updateSymptoms}
                onBack={prevStep}
                onNext={nextStep}
                onSwitchMode={updateMode}
              />
            )}

            {/* Bước 3: Dị ứng */}
            {step === 3 && (
              <AllergyStep
                data={draft.allergy}
                onChange={updateAllergy}
                onBack={prevStep}
                onNext={nextStep}
              />
            )}

            {/* Bước 4: Xác nhận */}
            {step === 4 && (
              <ConfirmStep
                summary={state.summary}
                loadingSummary={!state.summary}
                error={socketError?.message_vi}
                connected={socketStatus === 'connected'}
                onConfirm={() => {
                  confirmPatient('confirmed', ['chief_complaint', 'pain', 'extra_symptoms', 'allergy']);
                }}
                onEditField={(target) => {
                  confirmPatient('needs_edit', []);
                  if (target === 'allergy') goToStep(3);
                  else {
                    setEditTab(['pain_scale', 'onset'].includes(target) && draft.symptoms.hasPain !== true ? 'pain_body' : target);
                    goToStep(2);
                  }
                }}
                onEdit={() => {
                  confirmPatient('needs_edit', []);
                  setEditTab('complaint');
                  goToStep(2);
                }}
                onUnsure={() => {
                  confirmPatient('unsure', []);
                  handleCallInterpreter(false);
                  goToStep(2);
                }}
              />
            )}

            {/* Bước 5: Màn hình chờ & Cấp STT */}
            {step === 5 && (
              <WaitingStep
                queueNumber={state.queueNumber}
                intakeCode={state.intakeCode}
              />
            )}
          </div>
        )}
      </main>

      {/* Modal Câu hỏi từ Điều dưỡng */}
      <NurseQuestionModal
        question={nurseQuestion}
        onAnswer={handleNurseAnswer}
        connected={socketStatus === 'connected'}
        error={socketError?.message_vi}
        onClose={() => setNurseQuestion(null)}
      />

      {/* Modal Hỗ trợ Phiên dịch VSL */}
      <Modal
        isOpen={isInterpreterModalOpen}
        onClose={() => setIsInterpreterModalOpen(false)}
        title={vi.interpreter.modalTitle}
      >
        <div className="space-y-4">
          <p className="text-base text-ink leading-relaxed">
            Bản thử nghiệm mô phỏng yêu cầu hỗ trợ phiên dịch. Nếu cần trợ giúp ngay, hãy ra hiệu cho nhân viên tại quầy.
          </p>
          <div className="p-4 bg-warn-bg text-warn rounded-xl font-bold flex items-center gap-3">
            <HelpCircle className="w-6 h-6 flex-shrink-0" />
            <span>{state.interpreterRequested ? 'Điều phối đã nhận yêu cầu mô phỏng.' : 'Chưa có xác nhận từ điều phối.'}</span>
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setIsInterpreterModalOpen(false)}>
              {vi.common.close}
            </Button>
            <Button variant="danger" onClick={() => handleCallInterpreter(true)}>
              {vi.interpreter.requestUrgent}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Cảnh báo Idle Reset */}
      <Modal
        isOpen={showIdleWarning}
        onClose={dismissWarning}
        title={vi.idle.warningTitle}
      >
        <div className="space-y-6 text-center">
          <p className="text-lg text-ink font-medium leading-relaxed">
            {vi.idle.warningMessage}
          </p>
          <div className="text-6xl font-black text-danger font-mono">
            {secondsRemaining}s
          </div>
          <Button variant="primary" onClick={dismissWarning} className="w-full text-xl py-4">
            {vi.idle.continueButton}
          </Button>
        </div>
      </Modal>
    </div>
  );
};

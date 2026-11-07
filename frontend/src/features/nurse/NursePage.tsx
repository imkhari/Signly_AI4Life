import React, { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Check, CheckCircle, ShieldCheck } from 'lucide-react';
import { useSession } from '../../state/SessionContext';
import { useSessionSocket } from '../../hooks/useSessionSocket';
import { restApi } from '../../services/api/rest';
import { NurseHeader } from './components/NurseHeader';
import { ConfirmedPanel } from './components/ConfirmedPanel';
import { AlertsPanel } from './components/AlertsPanel';
import { QuestionPicker, QuestionTemplate } from './components/QuestionPicker';
import { ExportRecordModal } from './components/ExportRecordModal';
import { SessionResetModal } from './components/SessionResetModal';
import { Button } from '../../ui/Button';
import { Modal } from '../../ui/Modal';
import { vi } from '../../i18n/vi';

export const NursePage: React.FC = () => {
  const { state, dispatch } = useSession();
  const {
    socketStatus,
    verifyNurse,
    sendNurseQuestion,
    exportRecord,
    requestInterpreter,
    resetSession,
  } = useSessionSocket();

  const [queueNumber, setQueueNumber] = useState<number>(42);
  const [acknowledgedAlerts, setAcknowledgedAlerts] = useState<Set<string>>(new Set());
  const [audioAlertEnabled, setAudioAlertEnabled] = useState<boolean>(true);
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [isResetOpen, setIsResetOpen] = useState<boolean>(false);
  const [isInterpreterModalOpen, setIsInterpreterModalOpen] = useState<boolean>(false);
  const [isLoadingSession, setIsLoadingSession] = useState<boolean>(false);
  const [sessionError, setSessionError] = useState<string | null>(null);

  // Khởi tạo phiên làm việc cho điều dưỡng
  const handleCreateSession = useCallback(() => {
    setIsLoadingSession(true);
    setSessionError(null);
    restApi
      .createSession()
      .then((res) => {
        dispatch({
          type: 'INIT_SESSION',
          payload: {
            sessionId: res.session_id,
            role: 'nurse',
            token: res.token_nurse,
            pairingCode: res.pairing_code,
          },
        });
      })
      .catch((err) => {
        console.error('Failed to create session:', err);
        setSessionError(
          'Không thể kết nối máy chủ điều phối Backend (:8000). Vui lòng khởi động backend bằng lệnh: make demo hoặc make dev'
        );
      })
      .finally(() => {
        setIsLoadingSession(false);
      });
  }, [dispatch]);

  useEffect(() => {
    if (!state.sessionId || state.role !== 'nurse') {
      handleCreateSession();
    }
  }, [state.sessionId, state.role, handleCreateSession]);

  // Intake code: ưu tiên từ summary/state, fallback AC-0042
  const intakeCode =
    state.intakeCode || state.summary?.intake_code || `AC-${String(queueNumber).padStart(4, '0')}`;

  // Kiểm tra điều kiện mở khóa nút Duyệt phiếu (Verification Lock)
  const isPatientConfirmed =
    state.status === 'patient_confirmed' || state.status === 'nurse_verified';

  const unacknowledgedCritical = state.alerts.filter(
    (a) => a.level === 'critical' && !acknowledgedAlerts.has(a.code)
  );

  const isVerified = state.status === 'nurse_verified';
  const canVerify = isPatientConfirmed && unacknowledgedCritical.length === 0 && !isVerified;

  // Xử lý xác nhận alert (Acknowledge)
  const handleAcknowledgeAlert = (code: string) => {
    setAcknowledgedAlerts((prev) => new Set([...prev, code]));
  };

  // Xử lý gửi câu hỏi mẫu cho bệnh nhân
  const handleSendQuestion = (tmpl: QuestionTemplate) => {
    const questionId = `q-${Date.now()}`;
    sendNurseQuestion(
      questionId,
      tmpl.templateCode,
      tmpl.textVi,
      'yes_no_unsure',
      tmpl.iconName
    );
  };

  // Xử lý duyệt phiếu
  const handleVerify = () => {
    if (!canVerify) return;
    verifyNurse(intakeCode, queueNumber, Array.from(acknowledgedAlerts));
  };

  // Xử lý gọi phiên dịch
  const handleRequestInterpreter = () => {
    requestInterpreter('nurse_request', 'urgent');
    setIsInterpreterModalOpen(true);
  };

  // Xử lý xuất hồ sơ
  const handleConfirmExport = () => {
    exportRecord('print');
  };

  // Xử lý kết thúc và làm mới phiên
  const handleConfirmReset = () => {
    resetSession('completed');
    setAcknowledgedAlerts(new Set());
    setQueueNumber((prev) => prev + 1);
    // Tự động tạo phiên mới cho bệnh nhân tiếp theo
    setIsLoadingSession(true);
    restApi
      .createSession()
      .then((res) => {
        dispatch({
          type: 'INIT_SESSION',
          payload: {
            sessionId: res.session_id,
            role: 'nurse',
            token: res.token_nurse,
            pairingCode: res.pairing_code,
          },
        });
      })
      .catch((err) => {
        console.error('Failed to create new session after reset:', err);
      })
      .finally(() => {
        setIsLoadingSession(false);
      });
  };

  if (isLoadingSession && !state.sessionId) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center p-6">
        <div className="bg-paper p-8 rounded-2xl border border-gray-200 shadow-sm text-center max-w-md w-full">
          <div className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h2 className="text-lg font-bold text-ink">Đang tạo phiên làm việc mới...</h2>
          <p className="text-xs text-mute mt-1">Đang kết nối tới máy chủ điều phối sàng lọc</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      {/* Top Header */}
      <NurseHeader
        queueNumber={queueNumber}
        onQueueNumberChange={setQueueNumber}
        intakeCode={intakeCode}
        pairingCode={state.pairingCode}
        socketStatus={socketStatus}
        sessionStatus={state.status}
        audioAlertEnabled={audioAlertEnabled}
        onToggleAudioAlert={() => setAudioAlertEnabled((prev) => !prev)}
        onRequestInterpreter={handleRequestInterpreter}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenReset={() => setIsResetOpen(true)}
        onCreateNewSession={handleCreateSession}
        isLoadingSession={isLoadingSession}
      />

      {/* Main Board */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-6">
        {/* Backend Connection Error Banner */}
        {sessionError && (
          <div
            role="alert"
            className="p-4 rounded-2xl bg-danger-bg border-2 border-danger/40 text-danger flex flex-wrap items-center justify-between gap-4 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <div>
                <p className="font-extrabold text-sm">{sessionError}</p>
                <p className="text-xs text-ink/70 mt-0.5">
                  Vui lòng kiểm tra Terminal và chạy: <code>make demo</code> hoặc <code>make dev</code>
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleCreateSession}
              disabled={isLoadingSession}
              className="px-4 py-2 bg-danger text-white rounded-xl font-bold text-sm hover:bg-danger/90 transition-colors cursor-pointer disabled:opacity-50"
            >
              {isLoadingSession ? 'Đang thử lại...' : 'Thử lại ngay'}
            </button>
          </div>
        )}
        {/* Verification banner if already verified */}
        {isVerified && (
          <div
            data-testid="nurse-verified-banner"
            className="p-4 rounded-2xl bg-status-success/15 border-2 border-status-success text-status-success flex items-center justify-between shadow-sm animate-fade-in"
          >
            <div className="flex items-center gap-3">
              <CheckCircle className="w-7 h-7 shrink-0" />
              <div>
                <p className="text-base font-extrabold">
                  {vi.nurse.verifiedBadge} — STT: {queueNumber} ({intakeCode})
                </p>
                <p className="text-xs text-status-success/80">
                  Màn hình Kiosk bệnh nhân đã nhận được số thứ tự và hướng dẫn vào phòng khám.
                </p>
              </div>
            </div>
            <Button
              variant="secondary"
              onClick={() => setIsExportOpen(true)}
              className="min-h-[44px] py-1.5 px-3 text-sm bg-paper text-ink border-status-success/40"
            >
              {vi.nurse.exportAction}
            </Button>
          </div>
        )}

        {/* 2-Column Summary Board */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 items-start">
          {/* Left Column (7 cols): Confirmed Panel */}
          <section className="lg:col-span-7 h-full">
            <ConfirmedPanel
              status={state.status}
              frame={state.frame}
              summary={state.summary}
            />
          </section>

          {/* Right Column (5 cols): Alerts Panel (Top) & Question Picker (Bottom) */}
          <section className="lg:col-span-5 flex flex-col gap-6">
            <AlertsPanel
              alerts={state.alerts}
              acknowledgedAlerts={acknowledgedAlerts}
              onAcknowledgeAlert={handleAcknowledgeAlert}
              audioAlertEnabled={audioAlertEnabled}
            />

            <QuestionPicker
              onSendQuestion={handleSendQuestion}
              disabled={socketStatus !== 'connected'}
            />
          </section>
        </div>

        {/* Verification Action Bar (Bottom Sticky) */}
        <div className="bg-paper border border-gray-200 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-0.5 text-center sm:text-left">
            <h3 className="text-sm font-bold text-ink">Quyết định tiếp nhận & Cấp STT</h3>
            <p className="text-xs text-mute">
              {!isPatientConfirmed
                ? 'Đang chờ người bệnh xác nhận toàn bộ thông tin tại Kiosk...'
                : unacknowledgedCritical.length > 0
                ? vi.nurse.verifyDisabledReason
                : isVerified
                ? 'Phiếu tiếp nhận đã hoàn tất thẩm định.'
                : 'Mọi điều kiện hợp lệ. Nhấn duyệt để phát hành số thứ tự cho người bệnh.'}
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button
              variant={canVerify ? 'primary' : 'secondary'}
              disabled={!canVerify}
              onClick={handleVerify}
              data-testid="btn-verify-intake"
              className={`w-full sm:w-auto font-bold text-base min-h-[56px] px-8 shadow-md transition-all ${
                canVerify
                  ? 'bg-status-success hover:bg-status-success/90 text-white border-status-success'
                  : 'opacity-60 cursor-not-allowed bg-canvas'
              }`}
            >
              {isVerified ? (
                <>
                  <Check className="w-5 h-5 text-status-success" />
                  <span>{vi.nurse.verifiedBadge}</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5" />
                  <span>{vi.nurse.verifyAction}</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </main>

      {/* Export Modal */}
      <ExportRecordModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        queueNumber={queueNumber}
        intakeCode={intakeCode}
        frame={state.frame}
        summary={state.summary}
        onConfirmExport={handleConfirmExport}
      />

      {/* Session Reset Confirmation Modal */}
      <SessionResetModal
        isOpen={isResetOpen}
        onClose={() => setIsResetOpen(false)}
        onConfirmReset={handleConfirmReset}
      />

      {/* Interpreter Status Modal */}
      <Modal
        isOpen={isInterpreterModalOpen}
        onClose={() => setIsInterpreterModalOpen(false)}
        title={vi.interpreter.modalTitle}
      >
        <div className="space-y-4 text-center py-2">
          <div className="w-14 h-14 rounded-full bg-brand-light text-brand flex items-center justify-center mx-auto">
            <div className="w-6 h-6 border-3 border-brand border-t-transparent rounded-full animate-spin" />
          </div>
          <div>
            <h3 className="text-base font-bold text-ink">{vi.interpreter.statusConnecting}</h3>
            <p className="text-xs text-mute mt-1">{vi.interpreter.waitEstimate}</p>
          </div>
          <div className="p-3 rounded-xl bg-canvas text-xs text-mute border border-gray-200">
            Hệ thống đang kết nối đường truyền video VRI tới phiên dịch viên ngôn ngữ ký hiệu VSL trực ban.
          </div>
          <div className="pt-2 flex justify-center">
            <Button
              variant="secondary"
              onClick={() => setIsInterpreterModalOpen(false)}
              className="min-h-[44px] py-1.5 px-4 text-sm"
            >
              {vi.common.close}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

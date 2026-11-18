import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Activity,
  AlertTriangle,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  Zap,
  CheckCircle,
  ExternalLink,
  Clock,
  Hand,
} from 'lucide-react';
import { useSession } from '../../state/SessionContext';
import { useSessionSocket } from '../../hooks/useSessionSocket';
import { restApi } from '../../services/api/rest';
import { socketClient } from '../../services/ws/socketClient';
import { SummaryReadyPayload } from '../../types';
import { Button } from '../../ui/Button';

export const DemoPage: React.FC = () => {
  const { state } = useSession();
  const { sendInput, requestSummary, resetSession, socketStatus, socketError } = useSessionSocket();

  const [healthStatus, setHealthStatus] = useState<{ status: string; llm_mode: string } | null>(
    null
  );
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [isTestingLatency, setIsTestingLatency] = useState(false);
  const [isForceFallbackActive, setIsForceFallbackActive] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const [pending, setPending] = useState<'input' | 'fallback' | 'reset' | null>(null);
  const connected = socketStatus === 'connected' && healthStatus?.llm_mode === 'mock';
  const patientControls = connected && state.role === 'patient';
  const nurseControls = connected && state.role === 'nurse';

  useEffect(() => {
    if (!pending) return;
    const timeout = setTimeout(() => {
      setPending(null);
      setNotification('Chưa nhận được phản hồi. Kiểm tra trạng thái phiên rồi thử lại.');
    }, 5000);
    return () => clearTimeout(timeout);
  }, [pending]);

  useEffect(() => {
    if (!pending || !socketError) return;
    setPending(null);
    setNotification(socketError.message_vi);
  }, [pending, socketError]);

  // Lấy trạng thái backend
  useEffect(() => {
    restApi
      .getHealth()
      .then((res) => {
        setHealthStatus({ status: res.status, llm_mode: res.llm_mode });
      })
      .catch(() => {
        setHealthStatus({ status: 'offline', llm_mode: 'unavailable' });
      });
  }, []);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification((curr) => (curr === msg ? null : curr));
    }, 3500);
  };

  // Đo độ trễ REST/Network
  const handleTestLatency = async () => {
    setIsTestingLatency(true);
    const start = performance.now();
    try {
      await restApi.getHealth();
      const end = performance.now();
      setLatencyMs(Math.round(end - start));
    } catch {
      setLatencyMs(null);
    } finally {
      setIsTestingLatency(false);
    }
  };

  // Kịch bản 1: Cấp cứu Đau Ngực (Cờ đỏ Red-flag)
  const handleScenarioEmergencyChestPain = () => {
    if (sendInput(
      'pain_details',
      {
        chief_complaint: { code: 'PAIN', label_vi: 'Đau / Nhức', free_text: null },
        pain: {
          present: true,
          severity: 8,
          body_regions: ['CHEST'],
          onset: { value: 2, unit: 'hour' },
        },
        allergy: { has_allergy: false, items: [] },
      },
      'touch'
    )) waitForResult('input');
  };

  // Kịch bản 2: Mâu thuẫn Dị Ứng (Rule 10)
  const handleScenarioAllergyConflict = () => {
    if (sendInput(
      'allergy',
      {
        allergy: { has_allergy: false, items: [] },
      },
      'text',
      { type: 'text', text: 'Tôi từng bị sốc thuốc khi uống penicillin lúc nhỏ' }
    )) waitForResult('input');
  };

  function waitForResult(kind: 'input' | 'fallback' | 'reset') {
    setNotification(null);
    setPending(kind);
  }

  useEffect(() => {
    if (!pending) return;
    const event = pending === 'input' ? 'INPUT_UPDATED' :
      pending === 'fallback' ? 'SUMMARY_READY' : 'SESSION_RESET';
    return socketClient.on<SummaryReadyPayload>(event, (payload) => {
      setPending(null);
      setNotification(pending === 'input' ? 'Điều phối đã cập nhật dữ liệu mẫu của phiên.' :
        pending === 'reset' ? 'Điều phối đã kết thúc phiên.' :
        payload.summary.nl_source === 'fallback_template'
          ? 'Điều phối đã tạo bản tóm tắt bằng mẫu cố định.'
          : 'Điều phối đã trả bản tóm tắt từ LLM.');
    });
  }, [pending]);

  const handleToggleForceFallback = async () => {
    if (!state.sessionId) return;
    const nextState = !isForceFallbackActive;
    try {
      await restApi.forceFallback(state.sessionId, nextState);
      setIsForceFallbackActive(nextState);
      if (nextState) {
        waitForResult('fallback');
        requestSummary();
      } else {
        showToast('Đã tắt chế độ ép mẫu cố định cho phiên này.');
      }
    } catch {
      showToast('Không thể đổi cấu hình mẫu cố định của phiên.');
    }
  };

  const handleQuickReset = () => {
    waitForResult('reset');
    resetSession('manual');
  };

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      {/* Header */}
      <header className="bg-paper border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="p-2 rounded-xl text-mute hover:text-ink hover:bg-canvas transition-colors"
              aria-label="Về trang chủ"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold text-ink">Bảng Điều Khiển Demo Giám Khảo</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-brand text-white">
                  ENV=demo
                </span>
              </div>
              <p className="text-xs text-mute mt-0.5">
                Các thao tác 1 chạm để minh họa trực quan mọi tính năng an toàn y tế và trợ năng
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/patient"
              target="_blank"
              className="px-3.5 py-2 rounded-xl bg-canvas border border-gray-200 text-xs font-bold text-ink hover:bg-brand-light/30 flex items-center gap-1.5 transition-colors"
            >
              <span>Mở Màn hình Kiosk</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>

            <Link
              to="/nurse"
              target="_blank"
              className="px-3.5 py-2 rounded-xl bg-canvas border border-gray-200 text-xs font-bold text-ink hover:bg-brand-light/30 flex items-center gap-1.5 transition-colors"
            >
              <span>Mở Màn hình Y tá</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-6 space-y-6">
        {/* Toast Notification */}
        {notification && (
          <div role="status" className="p-3.5 rounded-xl border bg-paper text-ink text-sm font-semibold flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{notification}</span>
          </div>
        )}

        {/* System Health & Latency Monitor */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-paper border border-gray-200 shadow-sm space-y-1">
            <span className="text-xs font-bold text-mute uppercase tracking-wider block">
              Trạng thái Backend
            </span>
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  healthStatus?.status === 'ok' ? 'bg-status-success animate-pulse' : 'bg-status-danger'
                }`}
              />
              <span className="text-lg font-bold text-ink capitalize">
                {healthStatus?.status || 'Đang kiểm tra...'}
              </span>
            </div>
            <p className="text-xs text-mute">Chế độ AI: {healthStatus?.llm_mode || 'mock'}</p>
          </div>

          <div className="p-4 rounded-2xl bg-paper border border-gray-200 shadow-sm space-y-1">
            <span className="text-xs font-bold text-mute uppercase tracking-wider block">
              Phiên khám hiện tại
            </span>
            <p className="text-lg font-mono font-bold text-brand-dark">
              {state.pairingCode ? `Mã: ${state.pairingCode}` : 'Chưa ghép nối'}
            </p>
            <p className="text-xs text-mute">Trạng thái: {state.status}</p>
          </div>

          <div className="p-4 rounded-2xl bg-paper border border-gray-200 shadow-sm space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-mute uppercase tracking-wider">
                RTT kiểm tra /health
              </span>
              <button
                type="button"
                onClick={handleTestLatency}
                disabled={isTestingLatency}
                className="text-[11px] font-semibold text-brand hover:underline"
              >
                {isTestingLatency ? 'Đang đo...' : 'Đo lại'}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-status-warning" />
              <span className="text-lg font-bold text-ink">
                {latencyMs !== null ? `${latencyMs} ms` : 'Chưa đo'}
              </span>
            </div>
            <p className="text-xs text-mute">Thời gian hỏi đáp HTTP với backend.</p>
          </div>
        </div>

        {/* 1-Click Interactive Demo Scenarios */}
        <div className="bg-paper rounded-2xl border border-gray-200 p-6 shadow-sm space-y-5">
          <div className="border-b border-gray-200 pb-3">
            <h2 className="text-lg font-bold text-ink flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand" />
              <span>Kịch Bản Trình Diễn Trước Ban Giám Khảo (1 Chạm)</span>
            </h2>
            <p className="text-xs text-mute mt-0.5">
              Mở /demo trong chính tab bệnh nhân đã ghép cặp để gửi dữ liệu mẫu. Giữ màn điều dưỡng ở tab khác. Dùng tab điều dưỡng để kết thúc phiên.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Scenario 1: Emergency Chest Pain */}
            <div className="p-4 rounded-xl border border-status-danger/30 bg-status-danger/5 space-y-3 flex flex-col justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-status-danger font-bold text-sm">
                  <Activity className="w-4 h-4" />
                  <span>1. Cấp cứu Đau Ngực Dữ Dội (Cờ đỏ Red-flag)</span>
                </div>
                <p className="text-xs text-ink/80 leading-relaxed">
                  Bệnh nhân đau ngực mức 8/10, kéo dài 2 giờ. Parser tự động bật cờ đỏ khẩn cấp, màn hình y tá nháy chuông đỏ cảnh báo.
                </p>
              </div>
              <Button
                variant="danger"
                onClick={handleScenarioEmergencyChestPain}
                disabled={!patientControls || !!pending}
                className="min-h-[44px] py-2 text-sm font-bold w-full"
                data-testid="btn-demo-scenario-emergency"
              >
                Kích hoạt Cấp cứu Đau Ngực
              </Button>
            </div>

            {/* Scenario 2: Allergy Conflict */}
            <div className="p-4 rounded-xl border border-status-warning/40 bg-status-warning/5 space-y-3 flex flex-col justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-status-warning font-bold text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  <span>2. Mâu Thuẫn Khai Báo Dị Ứng (Rule 10)</span>
                </div>
                <p className="text-xs text-ink/80 leading-relaxed">
                  Bệnh nhân bấm &ldquo;Không dị ứng&rdquo; nhưng ghi chú nhắc tên thuốc Penicillin. Hệ thống bắt mâu thuẫn ngay lập tức, không tự suy đoán.
                </p>
              </div>
              <Button
                variant="secondary"
                onClick={handleScenarioAllergyConflict}
                disabled={!patientControls || !!pending}
                className="min-h-[44px] py-2 text-sm font-bold w-full border-status-warning text-status-warning hover:bg-status-warning/10"
                data-testid="btn-demo-scenario-allergy"
              >
                Kích hoạt Mâu thuẫn Dị ứng
              </Button>
            </div>

            {/* Scenario 3: Force Fallback */}
            <div className="p-4 rounded-xl border border-brand/30 bg-brand-light/20 space-y-3 flex flex-col justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-brand-dark font-bold text-sm">
                  <ShieldAlert className="w-4 h-4" />
                  <span>3. Ép dùng mẫu cố định</span>
                </div>
                <p className="text-xs text-ink/80 leading-relaxed">
                  Yêu cầu bản tóm tắt theo mẫu cố định. Dùng riêng ca kiểm thử mock độc hại để kiểm chứng validator.
                </p>
              </div>
              <Button
                variant={isForceFallbackActive ? 'danger' : 'secondary'}
                onClick={handleToggleForceFallback}
                disabled={!patientControls || !!pending || !['collecting', 'summary_ready'].includes(state.status)}
                className={`min-h-[44px] py-2 text-sm font-bold w-full ${
                  isForceFallbackActive ? '' : 'border-brand text-brand hover:bg-brand-light/30'
                }`}
                data-testid="btn-demo-force-fallback"
              >
                {isForceFallbackActive ? 'Tắt ép mẫu cố định' : 'Bật ép mẫu cố định'}
              </Button>
            </div>

            {/* Scenario 4: VSL Recognizer */}
            <div className="p-4 rounded-xl border border-gray-200 bg-canvas/60 space-y-3 flex flex-col justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-ink font-bold text-sm">
                  <Hand className="w-4 h-4 text-brand" />
                  <span>4. Thử gợi ý cử chỉ qua camera</span>
                </div>
                <p className="text-sm text-ink">
                  Mở màn bệnh nhân để thử camera. Nếu chưa diễn tập với người ký và thiết bị thật,
                  dùng Chạm cho buổi thi.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Privacy Wipe & Quick Reset */}
        <div className="p-5 rounded-2xl bg-paper border border-gray-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="text-sm font-bold text-ink flex items-center gap-2 justify-center sm:justify-start">
              <Clock className="w-4 h-4 text-mute" />
              <span>Làm Mới Toàn Bộ Phiên (Reset 1 Nút)</span>
            </h3>
            <p className="text-xs text-mute">
              Xóa sạch 100% dữ liệu RAM backend, sessionStorage, giải phóng camera và TTS để chuẩn bị lượt thi tiếp theo.
            </p>
          </div>

          <Button
            variant="danger"
            onClick={handleQuickReset}
            disabled={!nurseControls || !!pending}
            className="min-h-[48px] py-2 px-6 text-sm font-bold shrink-0"
            data-testid="btn-demo-quick-reset"
          >
            <RotateCcw className="w-4 h-4 mr-1.5" />
            <span>Reset Toàn Bộ Phiên</span>
          </Button>
        </div>
      </main>
    </div>
  );
};

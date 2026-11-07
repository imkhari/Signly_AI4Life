import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Bell,
  BellOff,
  Check,
  Copy,
  FileText,
  PhoneCall,
  RefreshCw,
  RotateCcw,
} from 'lucide-react';
import { ConnectionBadge } from '../../../ui/ConnectionBadge';
import { A11yControls } from '../../../ui/A11yControls';
import { Button } from '../../../ui/Button';
import { vi } from '../../../i18n/vi';
import { SessionStatus } from '../../../types';

interface NurseHeaderProps {
  queueNumber: number;
  onQueueNumberChange: (n: number) => void;
  intakeCode: string;
  pairingCode: string | null;
  socketStatus: 'disconnected' | 'connecting' | 'connected' | 'reconnecting';
  sessionStatus: SessionStatus;
  audioAlertEnabled: boolean;
  onToggleAudioAlert: () => void;
  onRequestInterpreter: () => void;
  onOpenExport: () => void;
  onOpenReset: () => void;
  onCreateNewSession?: () => void;
  isLoadingSession?: boolean;
}

export const NurseHeader: React.FC<NurseHeaderProps> = ({
  queueNumber,
  onQueueNumberChange,
  intakeCode,
  pairingCode,
  socketStatus,
  sessionStatus,
  audioAlertEnabled,
  onToggleAudioAlert,
  onRequestInterpreter,
  onOpenExport,
  onOpenReset,
  onCreateNewSession,
  isLoadingSession,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (pairingCode) {
      navigator.clipboard.writeText(pairingCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getStatusLabel = () => {
    switch (sessionStatus) {
      case 'created':
        return 'Chờ Kiosk kết nối';
      case 'paired':
      case 'collecting':
        return 'Bệnh nhân đang nhập';
      case 'summary_ready':
        return 'Chờ BN kiểm tra';
      case 'patient_confirmed':
        return '✔ BN đã xác nhận';
      case 'nurse_verified':
        return '★ Đã duyệt tiếp nhận';
      default:
        return 'Đang hoạt động';
    }
  };

  return (
    <header className="bg-paper border-b border-gray-200 px-6 py-4 shadow-sm">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        {/* Left: Brand + Navigation + STT / Intake code */}
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          <Link
            to="/"
            className="p-2 rounded-xl text-mute hover:text-ink hover:bg-canvas transition-colors"
            aria-label="Về trang chủ"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>

          <div>
            <span className="text-xs font-semibold text-mute uppercase tracking-wider block">
              {vi.nurse.dashboardTitle}
            </span>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 bg-canvas px-3 py-1 rounded-lg border border-gray-200">
                <span className="text-xs font-bold text-mute">STT:</span>
                <input
                  type="number"
                  min="1"
                  max="999"
                  value={queueNumber}
                  onChange={(e) => onQueueNumberChange(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-12 text-center font-bold text-ink bg-transparent focus:outline-none"
                  aria-label="Số thứ tự"
                />
              </div>

              <div className="flex items-center gap-1.5 bg-canvas px-3 py-1 rounded-lg border border-gray-200">
                <span className="text-xs font-bold text-mute">Mã:</span>
                <span className="text-sm font-extrabold text-brand-dark">{intakeCode}</span>
              </div>
            </div>
          </div>

          {/* Pairing Code for patient kiosk */}
          <div className="bg-brand-light/50 border border-brand/30 px-3.5 py-1.5 rounded-xl flex items-center gap-3 shadow-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-brand-dark block tracking-wider">
                {vi.nurse.pairingCodeLabel}
              </span>
              <span
                className="text-xl font-mono font-black text-brand-dark tracking-widest"
                data-testid="nurse-pairing-code"
              >
                {pairingCode || (isLoadingSession ? '...' : 'CHƯA CÓ')}
              </span>
            </div>

            <div className="flex items-center gap-1 pl-2 border-l border-brand/20">
              {pairingCode ? (
                <button
                  type="button"
                  onClick={handleCopy}
                  className="p-1.5 rounded-lg bg-white/90 hover:bg-white text-brand-dark transition-colors border border-brand/20 cursor-pointer shadow-xs"
                  title="Sao chép mã ghép nối"
                  aria-label="Sao chép mã ghép nối"
                >
                  {copied ? <Check className="w-4 h-4 text-status-success" /> : <Copy className="w-4 h-4" />}
                </button>
              ) : null}

              {onCreateNewSession && (
                <button
                  type="button"
                  onClick={onCreateNewSession}
                  disabled={isLoadingSession}
                  className="p-1.5 rounded-lg bg-white/90 hover:bg-white text-brand-dark transition-colors border border-brand/20 cursor-pointer shadow-xs disabled:opacity-50"
                  title="Tạo mã ghép nối mới"
                  aria-label="Tạo mã ghép nối mới"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingSession ? 'animate-spin' : ''}`} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Center/Right: Badges & Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <ConnectionBadge status={socketStatus} />

          <span
            className={`text-xs font-bold px-3 py-1 rounded-full border ${
              sessionStatus === 'patient_confirmed'
                ? 'bg-status-success/10 text-status-success border-status-success/30'
                : sessionStatus === 'nurse_verified'
                ? 'bg-brand/10 text-brand-dark border-brand/30'
                : 'bg-canvas text-mute border-gray-200'
            }`}
          >
            {getStatusLabel()}
          </span>

          {/* Sound alert toggle */}
          <button
            type="button"
            onClick={onToggleAudioAlert}
            className={`p-2 rounded-xl border transition-colors ${
              audioAlertEnabled
                ? 'bg-status-warning/10 text-status-warning border-status-warning/30 hover:bg-status-warning/20'
                : 'bg-canvas text-mute border-gray-200 hover:text-ink'
            }`}
            title={audioAlertEnabled ? 'Tắt âm báo khẩn' : 'Bật âm báo khẩn'}
            aria-label={audioAlertEnabled ? 'Tắt âm báo khẩn' : 'Bật âm báo khẩn'}
          >
            {audioAlertEnabled ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
          </button>

          {/* Call Interpreter */}
          <Button
            variant="secondary"
            onClick={onRequestInterpreter}
            className="min-h-[44px] py-1.5 px-3 text-sm"
            aria-label="Gọi phiên dịch VRI"
          >
            <PhoneCall className="w-4 h-4 text-brand" />
            <span className="hidden md:inline">{vi.nurse.callInterpreter}</span>
          </Button>

          {/* Export record */}
          <Button
            variant="secondary"
            onClick={onOpenExport}
            className="min-h-[44px] py-1.5 px-3 text-sm"
            aria-label="Xuất hồ sơ bàn giao"
          >
            <FileText className="w-4 h-4 text-ink" />
            <span className="hidden md:inline">{vi.nurse.exportAction}</span>
          </Button>

          {/* Reset session */}
          <Button
            variant="ghost"
            onClick={onOpenReset}
            className="min-h-[44px] py-1.5 px-3 text-sm text-status-danger hover:bg-status-danger/10 hover:text-status-danger"
            aria-label="Kết thúc phiên"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="hidden lg:inline">{vi.nurse.resetAction}</span>
          </Button>

          <A11yControls />
        </div>
      </div>
    </header>
  );
};

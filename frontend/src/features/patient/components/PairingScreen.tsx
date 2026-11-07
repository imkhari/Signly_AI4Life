import React, { useCallback, useEffect, useState } from 'react';
import { Clipboard, Delete, ExternalLink, KeyRound } from 'lucide-react';
import { Button } from '../../../ui/Button';
import { restApi } from '../../../services/api/rest';
import { useSession } from '../../../state/SessionContext';

export interface PairingScreenProps {
  onPaired: () => void;
}

// Hàng số (0-9) và các chữ cái (A-Z) đầy đủ
const NUMPAD_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];

const LETTER_KEYS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
];

export const PairingScreen: React.FC<PairingScreenProps> = ({ onPaired }) => {
  const { dispatch } = useSession();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleKeyPress = useCallback((char: string) => {
    setCode((prev) => {
      if (prev.length < 6) {
        setError(null);
        return prev + char.toUpperCase();
      }
      return prev;
    });
  }, []);

  const handleDelete = useCallback(() => {
    setCode((prev) => prev.slice(0, -1));
    setError(null);
  }, []);

  const handleClear = useCallback(() => {
    setCode('');
    setError(null);
  }, []);

  const handleSubmitWithCode = useCallback(
    async (codeToSubmit: string) => {
      if (codeToSubmit.length < 6) {
        setError('Vui lòng nhập đủ 6 ký tự mã hiển thị trên màn hình y tá.');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const res = await restApi.joinSession(codeToSubmit);
        dispatch({
          type: 'INIT_SESSION',
          payload: {
            sessionId: res.session_id,
            role: 'patient',
            token: res.token_patient,
            pairingCode: codeToSubmit,
          },
        });
        onPaired();
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'Không thể kết nối tới phiên khám. Vui lòng kiểm tra mã.';
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    [dispatch, onPaired]
  );

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    handleSubmitWithCode(code);
  };

  // Hỗ trợ gõ trực tiếp bằng bàn phím máy tính thật (Physical Keyboard)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Bỏ qua nếu người dùng đang dùng tổ hợp phím Cmd/Ctrl
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === 'Backspace') {
        e.preventDefault();
        handleDelete();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (code.length === 6) {
          handleSubmitWithCode(code);
        }
      } else if (e.key === 'Escape') {
        handleClear();
      } else if (/^[a-zA-Z0-9]$/.test(e.key)) {
        e.preventDefault();
        handleKeyPress(e.key.toUpperCase());
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [code, handleDelete, handleClear, handleKeyPress, handleSubmitWithCode]);

  // Hỗ trợ dán mã từ Clipboard
  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const cleaned = text.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
      if (cleaned.length > 0) {
        setCode(cleaned);
        setError(null);
        if (cleaned.length === 6) {
          handleSubmitWithCode(cleaned);
        }
      }
    } catch {
      setError('Không thể đọc bộ nhớ tạm. Vui lòng gõ mã trực tiếp.');
    }
  };

  return (
    <div className="max-w-2xl w-full mx-auto p-4 md:p-6 flex flex-col items-center">
      <div className="w-16 h-16 rounded-2xl bg-action/10 text-action flex items-center justify-center mb-4">
        <KeyRound className="w-8 h-8" />
      </div>

      <h2 className="text-3xl font-extrabold text-ink mb-2 text-center">
        Nhập mã kết nối trạm khám
      </h2>
      <p className="text-mute text-base text-center mb-6 max-w-lg">
        Nhìn lên góc trên màn hình của Điều dưỡng để lấy mã ghép nối gồm 6 ký tự.
      </p>

      {/* 6 Ô hiển thị ký tự mã */}
      <div
        className="flex justify-center gap-2 sm:gap-3 mb-6 select-none"
        role="group"
        aria-label="Mã kết nối 6 ký tự"
      >
        {Array.from({ length: 6 }).map((_, idx) => {
          const char = code[idx] || '';
          const isCurrent = idx === code.length;

          return (
            <div
              key={idx}
              className={`w-12 h-14 sm:w-14 sm:h-16 rounded-xl border-2 flex items-center justify-center font-mono text-2xl sm:text-3xl font-black transition-all ${
                char
                  ? 'border-action bg-action/5 text-action shadow-sm'
                  : isCurrent
                    ? 'border-action bg-paper ring-4 ring-action/20'
                    : 'border-gray-300 bg-paper text-mute'
              }`}
            >
              {char}
            </div>
          );
        })}
      </div>

      {error && (
        <div
          role="alert"
          className="w-full mb-6 p-4 rounded-xl bg-danger-bg border border-danger/30 text-danger text-center font-bold text-base"
        >
          {error}
        </div>
      )}

      {/* Bàn phím ảo cảm ứng Kiosk đầy đủ (Số + Chữ) */}
      <div className="w-full bg-paper p-4 rounded-2xl border border-gray-200 shadow-sm mb-6">
        {/* Hàng số 0-9 */}
        <div className="mb-3">
          <div className="text-[11px] font-bold text-mute uppercase tracking-wider mb-1.5 px-1">
            Chữ số (0 - 9)
          </div>
          <div className="grid grid-cols-10 gap-1.5 sm:gap-2">
            {NUMPAD_KEYS.map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => handleKeyPress(k)}
                disabled={code.length >= 6 || loading}
                className="h-12 rounded-xl bg-canvas hover:bg-action hover:text-white font-bold text-lg border border-gray-200 transition-colors cursor-pointer select-none disabled:opacity-40"
                aria-label={`Số ${k}`}
              >
                {k}
              </button>
            ))}
          </div>
        </div>

        {/* Các hàng chữ cái A-Z chuẩn QWERTY */}
        <div className="space-y-2">
          <div className="text-[11px] font-bold text-mute uppercase tracking-wider mb-1 px-1">
            Chữ cái (A - Z)
          </div>
          {LETTER_KEYS.map((row, rowIdx) => (
            <div key={rowIdx} className="flex justify-center gap-1.5 sm:gap-2">
              {row.map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => handleKeyPress(k)}
                  disabled={code.length >= 6 || loading}
                  className="flex-1 max-w-[56px] h-12 rounded-xl bg-canvas hover:bg-action hover:text-white font-bold text-lg border border-gray-200 transition-colors cursor-pointer select-none disabled:opacity-40"
                  aria-label={`Chữ ${k}`}
                >
                  {k}
                </button>
              ))}
            </div>
          ))}
        </div>

        {/* Nút thao tác: Xóa lùi, Xóa hết, Dán mã */}
        <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-gray-100">
          <button
            type="button"
            onClick={handlePasteClipboard}
            disabled={loading}
            className="flex-1 min-w-[120px] h-11 rounded-xl bg-canvas hover:bg-gray-200 font-semibold text-sm border border-gray-200 transition-colors cursor-pointer select-none flex items-center justify-center gap-1.5 disabled:opacity-40"
            title="Dán mã từ bộ nhớ tạm"
          >
            <Clipboard className="w-4 h-4 text-mute" />
            <span>Dán từ bộ nhớ</span>
          </button>
          <button
            type="button"
            onClick={handleClear}
            disabled={code.length === 0 || loading}
            className="flex-1 min-w-[100px] h-11 rounded-xl bg-canvas hover:bg-gray-200 font-semibold text-sm border border-gray-200 transition-colors cursor-pointer select-none disabled:opacity-40"
          >
            Xóa hết
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={code.length === 0 || loading}
            className="flex-1 min-w-[120px] h-11 rounded-xl bg-canvas hover:bg-gray-200 font-semibold text-sm border border-gray-200 transition-colors cursor-pointer select-none flex items-center justify-center gap-1.5 disabled:opacity-40"
            aria-label="Xóa ký tự cuối"
          >
            <Delete className="w-4 h-4 text-mute" />
            <span>Xóa lùi</span>
          </button>
        </div>

        <p className="text-xs text-mute text-center mt-3">
          💡 <strong>Mẹo:</strong> Bạn có thể gõ trực tiếp bằng bàn phím máy tính thật (nhấn Enter để kết nối).
        </p>
      </div>

      <Button
        variant="primary"
        onClick={() => handleSubmit()}
        disabled={code.length < 6 || loading}
        className="w-full mb-4"
      >
        {loading ? 'Đang kết nối...' : 'Bắt đầu khai báo'}
      </Button>

      {/* Chỉ dẫn mở tab Điều dưỡng */}
      <div className="flex items-center gap-2 text-sm text-mute">
        <span>Chưa thấy mã kết nối?</span>
        <a
          href="/nurse"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-bold text-action hover:underline"
        >
          <span>Mở màn hình Điều dưỡng (/nurse) để lấy mã</span>
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
};

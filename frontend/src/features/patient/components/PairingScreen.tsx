import React, { useState } from 'react';
import { Delete, KeyRound } from 'lucide-react';
import { Button } from '../../../ui/Button';
import { restApi } from '../../../services/api/rest';
import { useSession } from '../../../state/SessionContext';

export interface PairingScreenProps {
  onPaired: () => void;
}

const KEYPAD_KEYS = [
  'A', 'B', 'C', 'D', 'E', 'F',
  'G', 'H', 'J', 'K', 'L', 'M',
  'N', 'P', 'Q', 'R', 'S', 'T',
  'U', 'V', 'W', 'X', 'Y', 'Z',
  '2', '3', '4', '5', '6', '7',
  '8', '9',
];

export const PairingScreen: React.FC<PairingScreenProps> = ({ onPaired }) => {
  const { dispatch } = useSession();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleKeyPress = (char: string) => {
    if (code.length < 6) {
      setCode((prev) => prev + char);
      setError(null);
    }
  };

  const handleDelete = () => {
    setCode((prev) => prev.slice(0, -1));
    setError(null);
  };

  const handleClear = () => {
    setCode('');
    setError(null);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (code.length < 6) {
      setError('Vui lòng nhập đủ 6 ký tự mã hiển thị trên màn hình y tá.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await restApi.joinSession(code);
      dispatch({
        type: 'INIT_SESSION',
        payload: {
          sessionId: res.session_id,
          role: 'patient',
          token: res.token_patient,
          pairingCode: code,
        },
      });
      onPaired();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Không thể kết nối tới phiên khám.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl w-full mx-auto p-6 flex flex-col items-center">
      <div className="w-16 h-16 rounded-2xl bg-action/10 text-action flex items-center justify-center mb-4">
        <KeyRound className="w-8 h-8" />
      </div>

      <h2 className="text-3xl font-extrabold text-ink mb-2 text-center">
        Nhập mã kết nối trạm khám
      </h2>
      <p className="text-mute text-base text-center mb-6 max-w-md">
        Nhìn lên màn hình của Điều dưỡng để lấy mã ghép nối 6 ký tự.
      </p>

      {/* 6 Ô hiển thị ký tự mã */}
      <div
        className="flex justify-center gap-3 mb-6 select-none"
        role="group"
        aria-label="Mã kết nối 6 ký tự"
      >
        {Array.from({ length: 6 }).map((_, idx) => {
          const char = code[idx] || '';
          const isCurrent = idx === code.length;

          return (
            <div
              key={idx}
              className={`w-14 h-16 rounded-xl border-2 flex items-center justify-center font-mono text-3xl font-black transition-all ${
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

      {/* Bàn phím ảo cảm ứng Kiosk */}
      <div className="w-full bg-paper p-4 rounded-2xl border border-gray-200 shadow-sm mb-6">
        <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
          {KEYPAD_KEYS.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => handleKeyPress(k)}
              disabled={code.length >= 6 || loading}
              className="h-14 rounded-xl bg-canvas hover:bg-action hover:text-white font-bold text-xl border border-gray-200 transition-colors cursor-pointer select-none disabled:opacity-40"
              aria-label={`Ký tự ${k}`}
            >
              {k}
            </button>
          ))}
        </div>

        <div className="flex gap-2 mt-3">
          <button
            type="button"
            onClick={handleClear}
            disabled={code.length === 0 || loading}
            className="flex-1 h-12 rounded-xl bg-canvas hover:bg-gray-200 font-semibold text-sm border border-gray-200 transition-colors cursor-pointer select-none disabled:opacity-40"
          >
            Xóa hết
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={code.length === 0 || loading}
            className="flex-1 h-12 rounded-xl bg-canvas hover:bg-gray-200 font-semibold text-sm border border-gray-200 transition-colors cursor-pointer select-none flex items-center justify-center gap-1.5 disabled:opacity-40"
            aria-label="Xóa ký tự cuối"
          >
            <Delete className="w-5 h-5" />
            <span>Xóa lùi</span>
          </button>
        </div>
      </div>

      <Button
        variant="primary"
        onClick={() => handleSubmit()}
        disabled={code.length < 6 || loading}
        className="w-full"
      >
        {loading ? 'Đang kết nối...' : 'Bắt đầu khai báo'}
      </Button>
    </div>
  );
};

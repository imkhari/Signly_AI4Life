import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export const NursePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      <header className="bg-paper border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="p-2 rounded-lg text-mute hover:bg-canvas transition-colors"
            aria-label="Về trang chủ"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-2xl font-bold text-ink">Bảng Điều phối Y tá</h1>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto p-6 flex flex-col items-center justify-center">
        <div className="bg-paper rounded-2xl p-8 border border-gray-200 shadow-sm text-center w-full">
          <h2 className="text-xl font-semibold text-ink mb-2">Quầy tiếp nhận & sàng lọc</h2>
          <p className="text-mute text-base">
            Bảng theo dõi thời gian thực dành cho điều dưỡng sẽ được triển khai tại Phase P7.
          </p>
        </div>
      </main>
    </div>
  );
};


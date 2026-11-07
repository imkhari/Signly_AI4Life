import React from 'react';
import { Link } from 'react-router-dom';
import { User, Stethoscope } from 'lucide-react';

export const HomeRoleSelect: React.FC = () => {
  return (
    <main className="min-h-screen bg-canvas flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full bg-paper rounded-2xl shadow-sm p-8 text-center border border-gray-200">
        <h1 className="text-3xl font-bold text-ink mb-2">AI4Care</h1>
        <p className="text-mute mb-8 text-base">
          Trợ lý tiếp nhận ban đầu tại quầy bệnh viện cho người Điếc và người khó khăn về lời nói.
        </p>

        <div className="space-y-4">
          <Link
            to="/patient"
            className="flex items-center justify-center gap-3 w-full py-4 px-6 bg-action text-white text-lg font-semibold rounded-xl hover:opacity-90 transition-opacity"
          >
            <User className="w-6 h-6" />
            <span>Màn hình Bệnh nhân</span>
          </Link>

          <Link
            to="/nurse"
            className="flex items-center justify-center gap-3 w-full py-4 px-6 bg-paper border-2 border-action text-action text-lg font-semibold rounded-xl hover:bg-canvas transition-colors"
          >
            <Stethoscope className="w-6 h-6" />
            <span>Màn hình Điều dưỡng</span>
          </Link>
        </div>
      </div>
    </main>
  );
};


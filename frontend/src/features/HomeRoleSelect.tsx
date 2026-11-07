import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  Heart,
  HelpCircle,
  Pill,
  Stethoscope,
  User,
} from 'lucide-react';
import {
  A11yControls,
  AlertCard,
  BigIconButton,
  Button,
  Card,
  ConnectionBadge,
  Modal,
  StatusPill,
  StepProgress,
  TTSButton,
} from '../ui';
import { vi } from '../i18n/vi';

export const HomeRoleSelect: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIconIdx, setSelectedIconIdx] = useState<number>(0);

  const steps = [
    { id: '1', label: vi.wizard.step1 },
    { id: '2', label: vi.wizard.step2 },
    { id: '3', label: vi.wizard.step3 },
    { id: '4', label: vi.wizard.step4 },
  ];

  return (
    <main className="min-h-screen bg-canvas p-6 md:p-12">
      {/* Thanh trên cùng */}
      <header className="max-w-5xl mx-auto flex items-center justify-between pb-6 mb-8 border-b border-gray-200">
        <div>
          <h1 className="text-3xl font-extrabold text-ink">{vi.app.title}</h1>
          <p className="text-mute text-base">{vi.app.slogan}</p>
        </div>
        <A11yControls onCallHelp={() => setIsModalOpen(true)} />
      </header>

      <div className="max-w-5xl mx-auto space-y-8">
        {/* Hướng dẫn quy trình ghép nối 2 màn hình */}
        <div className="bg-brand-light/40 border-2 border-brand/30 rounded-2xl p-4 sm:p-5 flex items-start sm:items-center gap-4 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-brand text-white flex items-center justify-center font-bold text-xl shrink-0">
            🔑
          </div>
          <div className="flex-1">
            <h3 className="font-extrabold text-ink text-base mb-1">
              Quy trình ghép nối 2 màn hình (Live Pairing)
            </h3>
            <p className="text-sm text-ink/80 leading-relaxed">
              <span className="font-bold text-brand-dark">1. Mở màn hình Điều dưỡng (/nurse):</span> Hệ thống tự động sinh <strong>Mã ghép nối 6 ký tự</strong> ở thanh tiêu đề trên cùng.
              <br />
              <span className="font-bold text-action">2. Mở màn hình Bệnh nhân (/patient):</span> Nhập đúng 6 ký tự này (bằng bàn phím máy tính hoặc bấm màn hình) để kết nối trực tiếp.
            </p>
          </div>
        </div>

        {/* Phần 1: Chọn vai trò màn hình */}
        <section aria-labelledby="role-select-title">
          <h2 id="role-select-title" className="text-2xl font-bold text-ink mb-4">
            {vi.roles.selectRole}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link
              to="/patient"
              className="flex flex-col justify-between p-8 bg-paper rounded-2xl border-2 border-action/40 hover:border-action shadow-sm transition-all group"
            >
              <div>
                <div className="w-16 h-16 rounded-2xl bg-action/10 text-action flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                  <User className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold text-ink mb-2">{vi.roles.patient}</h3>
                <p className="text-mute text-base">{vi.roles.patientDesc}</p>
              </div>
              <div className="mt-8">
                <span className="inline-flex items-center justify-center w-full min-h-[64px] bg-action text-white rounded-xl font-bold text-lg">
                  Vào màn hình Bệnh nhân
                </span>
              </div>
            </Link>

            <Link
              to="/nurse"
              className="flex flex-col justify-between p-8 bg-paper rounded-2xl border-2 border-action/40 hover:border-action shadow-sm transition-all group"
            >
              <div>
                <div className="w-16 h-16 rounded-2xl bg-action/10 text-action flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                  <Stethoscope className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold text-ink mb-2">{vi.roles.nurse}</h3>
                <p className="text-mute text-base">{vi.roles.nurseDesc}</p>
              </div>
              <div className="mt-8">
                <span className="inline-flex items-center justify-center w-full min-h-[64px] bg-paper border-2 border-action text-action rounded-xl font-bold text-lg hover:bg-canvas transition-colors">
                  Vào màn hình Điều dưỡng
                </span>
              </div>
            </Link>
          </div>

          {/* Chế độ Trình diễn Demo Giám Khảo */}
          <div className="mt-4">
            <Link
              to="/demo"
              className="p-4 bg-brand-light/30 border border-brand/30 hover:border-brand rounded-2xl flex items-center justify-between transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand text-white flex items-center justify-center font-bold">
                  🧪
                </div>
                <div>
                  <h4 className="text-base font-bold text-ink group-hover:text-brand transition-colors">
                    Bảng Điều Khiển Demo Giám Khảo (1 Chạm)
                  </h4>
                  <p className="text-xs text-mute">
                    Kịch bản cấp cứu cờ đỏ, mâu thuẫn dị ứng, ép lỗi LLM Fallback, ký hiệu VSL & đo độ trễ LAN
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-brand px-3 py-1.5 rounded-lg bg-paper border border-brand/20 group-hover:bg-brand group-hover:text-white transition-all">
                Mở /demo &rarr;
              </span>
            </Link>
          </div>
        </section>

        {/* Phần 2: Bảng mẫu thành phần UI (Kitchen Sink) */}
        <section aria-labelledby="kitchen-sink-title" className="pt-8 border-t border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 id="kitchen-sink-title" className="text-2xl font-bold text-ink">
                Bảng mẫu thành phần (Kitchen Sink)
              </h2>
              <p className="text-mute">
                Thư viện các component dùng chung tuân thủ Style Guide và WCAG AA.
              </p>
            </div>
            <ConnectionBadge status="connected" />
          </div>

          <div className="space-y-8">
            {/* 1. Nút bấm (Touch targets >= 64px) */}
            <Card>
              <h3 className="text-xl font-bold text-ink mb-4">
                1. Nút bấm chuẩn Kiosk (Chiều cao ≥ 64px)
              </h3>
              <div className="flex flex-wrap gap-4 items-center">
                <Button variant="primary">Nút chính (Action)</Button>
                <Button variant="secondary">Nút viền (Secondary)</Button>
                <Button variant="danger">Nút cảnh báo (Danger)</Button>
                <Button variant="ghost">Nút phụ (Ghost)</Button>
                <Button variant="primary" disabled>
                  Vô hiệu hóa
                </Button>
              </div>
            </Card>

            {/* 2. Nút bấm biểu tượng lớn (BigIconButton) */}
            <Card>
              <h3 className="text-xl font-bold text-ink mb-4">
                2. Nút chọn biểu tượng lớn (BigIconButton)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <BigIconButton
                  icon={<Activity className="w-12 h-12" />}
                  label="Đau nhức"
                  sublabel="Mức độ đau hoặc khó chịu"
                  selected={selectedIconIdx === 0}
                  onClick={() => setSelectedIconIdx(0)}
                />
                <BigIconButton
                  icon={<Heart className="w-12 h-12" />}
                  label="Tức ngực"
                  sublabel="Khó thở, tim đập nhanh"
                  selected={selectedIconIdx === 1}
                  onClick={() => setSelectedIconIdx(1)}
                />
                <BigIconButton
                  icon={<Pill className="w-12 h-12" />}
                  label="Dị ứng thuốc"
                  sublabel="Kháng sinh, giảm đau"
                  selected={selectedIconIdx === 2}
                  onClick={() => setSelectedIconIdx(2)}
                />
              </div>
            </Card>

            {/* 3. Tiến độ bước (StepProgress) */}
            <Card>
              <h3 className="text-xl font-bold text-ink mb-4">
                3. Thanh tiến độ 4 bước (StepProgress)
              </h3>
              <StepProgress steps={steps} currentStepIndex={1} />
            </Card>

            {/* 4. Nhãn trạng thái (StatusPill) */}
            <Card>
              <h3 className="text-xl font-bold text-ink mb-4">
                4. Nhãn trạng thái (Không chỉ dùng màu)
              </h3>
              <div className="flex flex-wrap gap-4 items-center">
                <StatusPill status="confirmed" label="Đã xác nhận" />
                <StatusPill status="pending" label="Chờ phản hồi" />
                <StatusPill status="warning" label="Cần hỏi lại" />
                <StatusPill status="danger" label="Nguy cơ dị ứng" />
              </div>
            </Card>

            {/* 5. Thẻ cảnh báo (AlertCard) */}
            <Card>
              <h3 className="text-xl font-bold text-ink mb-4">
                5. Thẻ cảnh báo phân cấp (AlertCard)
              </h3>
              <div className="space-y-3">
                <AlertCard
                  level="info"
                  message="Bạn có thể chọn lại vị trí bất cứ lúc nào trước khi bấm Xong."
                />
                <AlertCard
                  level="warning"
                  message="Chưa có thông tin dị ứng thuốc. Y tá sẽ hỏi lại bạn ở bước sau."
                />
                <AlertCard
                  level="critical"
                  message="Phát hiện dấu hiệu đau thắt ngực mức độ cao. Đang gửi tín hiệu khẩn cấp tới nhân viên y tế."
                />
              </div>
            </Card>

            {/* 6. Hỗ trợ tiếp cận âm thanh (TTSButton) */}
            <Card>
              <h3 className="text-xl font-bold text-ink mb-4">
                6. Đọc thành tiếng có phụ đề trực quan (TTSButton)
              </h3>
              <p className="text-mute mb-4">
                Bấm nút dưới đây để nghe đọc. Người Điếc có thể nhìn thấy phụ đề trực quan tương ứng.
              </p>
              <TTSButton text="Xin chào bạn! Vui lòng chọn vị trí đau trên màn hình." />
            </Card>
          </div>
        </section>
      </div>

      {/* Modal Hỗ trợ phiên dịch VSL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={vi.interpreter.modalTitle}
      >
        <div className="space-y-4">
          <p className="text-base text-ink leading-relaxed">
            Hệ thống đang chuẩn bị kết nối tới phiên dịch viên ngôn ngữ ký hiệu (VSL) trực tuyến.
          </p>
          <div className="p-4 bg-warn-bg text-warn rounded-xl font-semibold flex items-center gap-3">
            <HelpCircle className="w-6 h-6 flex-shrink-0" />
            <span>{vi.interpreter.waitEstimate}</span>
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              {vi.common.close}
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                alert('Đã gửi thông báo ưu tiên khẩn cấp cho y tá trực quầy!');
                setIsModalOpen(false);
              }}
            >
              {vi.interpreter.requestUrgent}
            </Button>
          </div>
        </div>
      </Modal>
    </main>
  );
};

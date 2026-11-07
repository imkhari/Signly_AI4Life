import React, { useEffect, useRef } from 'react';
import { AlertCircle, AlertTriangle, Check, Info } from 'lucide-react';
import { Alert } from '../../../types';
import { vi } from '../../../i18n/vi';

interface AlertsPanelProps {
  alerts: Alert[];
  acknowledgedAlerts: Set<string>;
  onAcknowledgeAlert: (code: string) => void;
  onAskQuestionFromAlert?: (alert: Alert) => void;
  audioAlertEnabled: boolean;
}

export const AlertsPanel: React.FC<AlertsPanelProps> = ({
  alerts,
  acknowledgedAlerts,
  onAcknowledgeAlert,
  audioAlertEnabled,
}) => {
  const previousAlertCount = useRef(alerts.length);

  // Play audio chime when a new critical alert appears
  useEffect(() => {
    const hasNewCritical =
      alerts.length > previousAlertCount.current &&
      alerts.some((a) => a.level === 'critical' && !acknowledgedAlerts.has(a.code));

    if (hasNewCritical && audioAlertEnabled) {
      try {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioContextClass) {
          const ctx = new AudioContextClass();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
          osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.25);
          gain.gain.setValueAtTime(0.2, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.25);
        }
      } catch {
        // AudioContext might be blocked until user gesture, safely ignore
      }
    }
    previousAlertCount.current = alerts.length;
  }, [alerts, acknowledgedAlerts, audioAlertEnabled]);

  const hasCritical = alerts.some((a) => a.level === 'critical' && !acknowledgedAlerts.has(a.code));

  return (
    <div
      data-testid="alerts-panel"
      className="bg-paper rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col"
      aria-live="assertive"
      aria-atomic="true"
    >
      {/* Title */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-200 mb-4">
        <div className="flex items-center gap-2">
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center ${
              hasCritical
                ? 'bg-status-danger/15 text-status-danger animate-pulse'
                : 'bg-status-warning/15 text-status-warning'
            }`}
          >
            {hasCritical ? (
              <AlertCircle className="w-4 h-4" />
            ) : (
              <AlertTriangle className="w-4 h-4" />
            )}
          </div>
          <h2 className="text-base font-bold text-ink">{vi.nurse.needsAttentionSection}</h2>
        </div>

        {hasCritical && (
          <span className="text-xs font-bold text-status-danger bg-status-danger/10 px-2.5 py-0.5 rounded-full border border-status-danger/30 animate-pulse">
            {vi.nurse.criticalAlertNotification}
          </span>
        )}
      </div>

      {/* Alerts list */}
      {alerts.length === 0 ? (
        <div className="text-center py-6 text-sm text-mute">
          <p>{vi.nurse.noAlerts}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => {
            const isAck = acknowledgedAlerts.has(alert.code);
            const isCritical = alert.level === 'critical';
            const isWarning = alert.level === 'warning';

            return (
              <div
                key={alert.code}
                data-testid={`alert-item-${alert.code}`}
                className={`p-3.5 rounded-xl border transition-all ${
                  isAck
                    ? 'bg-canvas/50 border-gray-200 text-mute opacity-60'
                    : isCritical
                    ? 'bg-status-danger/5 border-status-danger/40 text-ink ring-1 ring-status-danger/20'
                    : isWarning
                    ? 'bg-status-warning/5 border-status-warning/40 text-ink'
                    : 'bg-canvas border-gray-200 text-ink'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <span className="mt-0.5">
                      {isCritical ? (
                        <AlertCircle
                          className={`w-5 h-5 text-status-danger ${
                            !isAck ? 'animate-bounce' : ''
                          }`}
                        />
                      ) : isWarning ? (
                        <AlertTriangle className="w-5 h-5 text-status-warning" />
                      ) : (
                        <Info className="w-5 h-5 text-brand" />
                      )}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-mute">
                          [{alert.code}]
                        </span>
                        {isCritical && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 bg-status-danger text-white rounded">
                            KHẨN
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-ink mt-0.5">{alert.message_vi}</p>
                    </div>
                  </div>

                  {/* Acknowledge Button */}
                  <button
                    type="button"
                    onClick={() => onAcknowledgeAlert(alert.code)}
                    disabled={isAck}
                    className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
                      isAck
                        ? 'bg-canvas text-mute border border-gray-200 cursor-default'
                        : isCritical
                        ? 'bg-status-danger text-white hover:bg-status-danger/90'
                        : 'bg-paper text-ink border border-gray-300 hover:bg-canvas'
                    }`}
                    aria-label={`Xác nhận đã biết cảnh báo ${alert.code}`}
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{isAck ? vi.nurse.acknowledgedAlert : vi.nurse.acknowledgeAlert}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

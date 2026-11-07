import { useCallback, useEffect } from 'react';
import { useSession } from '../state/SessionContext';
import { socketClient } from '../services/ws/socketClient';
import {
  InputUpdatedServerPayload,
  InterpreterStatusPayload,
  NurseVerifiedPayload,
  PatientConfirmedPayload,
  SummaryReadyPayload,
} from '../types';

export function useSessionSocket() {
  const { state, dispatch } = useSession();
  const { sessionId, role, token } = state;

  useEffect(() => {
    if (!sessionId || !role || !token) return;

    socketClient.connect({
      sessionId,
      role,
      token,
      lastSeq: socketClient.getLastSeq(),
    });

    const unsubStatus = socketClient.onStatusChange((status) => {
      dispatch({ type: 'SET_SOCKET_STATUS', payload: status });
    });

    const unsubInput = socketClient.on<InputUpdatedServerPayload>(
      'INPUT_UPDATED',
      (payload) => {
        dispatch({
          type: 'FRAME_UPDATED',
          payload: {
            frame: payload.frame,
            alerts: payload.alerts,
            completeness: payload.completeness,
            step: payload.step,
          },
        });
      }
    );

    const unsubSummary = socketClient.on<SummaryReadyPayload>(
      'SUMMARY_READY',
      (payload) => {
        dispatch({ type: 'SUMMARY_READY', payload: payload.summary });
      }
    );

    const unsubConfirm = socketClient.on<PatientConfirmedPayload>(
      'PATIENT_CONFIRMED',
      (payload) => {
        dispatch({
          type: 'PATIENT_CONFIRMED',
          payload: {
            status: payload.decision === 'confirmed' ? 'patient_confirmed' : 'collecting',
          },
        });
      }
    );

    const unsubVerified = socketClient.on<NurseVerifiedPayload>(
      'NURSE_VERIFIED',
      (payload) => {
        dispatch({
          type: 'NURSE_VERIFIED',
          payload: {
            intakeCode: payload.intake_code,
            queueNumber: payload.queue_number,
          },
        });
      }
    );

    const unsubInterpreter = socketClient.on<InterpreterStatusPayload>(
      'INTERPRETER_STATUS',
      (payload) => {
        dispatch({ type: 'SET_INTERPRETER_STATUS', payload: payload.status });
      }
    );

    const unsubReset = socketClient.on('SESSION_RESET', () => {
      dispatch({ type: 'RESET_SESSION' });
    });

    return () => {
      unsubStatus();
      unsubInput();
      unsubSummary();
      unsubConfirm();
      unsubVerified();
      unsubInterpreter();
      unsubReset();
      socketClient.disconnect();
    };
  }, [sessionId, role, token, dispatch]);

  const sendInput = useCallback(
    (step: string, patch: Record<string, unknown>, modality: string = 'touch') => {
      socketClient.send('INPUT_UPDATED', {
        step,
        modality,
        patch,
      });
    },
    []
  );

  const requestSummary = useCallback(() => {
    socketClient.send('SUMMARY_REQUESTED', {
      language: 'vi',
      reading_level: 'simple',
    });
  }, []);

  const confirmPatient = useCallback(
    (decision: 'confirmed' | 'needs_edit' | 'unsure', confirmedFields: string[]) => {
      socketClient.send('PATIENT_CONFIRMED', {
        decision,
        confirmed_fields: confirmedFields,
      });
    },
    []
  );

  const verifyNurse = useCallback(
    (intakeCode: string, queueNumber: number, acknowledgedAlerts: string[] = []) => {
      socketClient.send('NURSE_VERIFIED', {
        intake_code: intakeCode,
        queue_number: queueNumber,
        verified_by: 'nurse-kiosk',
        acknowledged_alerts: acknowledgedAlerts,
      });
    },
    []
  );

  const requestInterpreter = useCallback(
    (reason: string = 'patient_request', urgency: 'normal' | 'urgent' = 'normal') => {
      socketClient.send('REQUEST_INTERPRETER', {
        reason,
        requested_by: state.role || 'patient',
        urgency,
        language: 'VSL',
      });
    },
    [state.role]
  );

  const sendNurseQuestion = useCallback(
    (
      questionId: string,
      templateCode: string,
      textVi: string,
      answerType: 'yes_no_unsure' | 'single_choice' | 'free_text' = 'yes_no_unsure',
      icon?: string
    ) => {
      socketClient.send('NURSE_QUESTION', {
        question_id: questionId,
        template_code: templateCode,
        text_vi: textVi,
        answer_type: answerType,
        icon: icon || null,
      });
    },
    []
  );

  const exportRecord = useCallback(
    (format: 'pdf' | 'print' | 'json' = 'print') => {
      socketClient.send('RECORD_EXPORTED', {
        format,
        include: ['queue_number', 'intake_code', 'confirmed_symptoms', 'alerts'],
        target: 'doctor',
      });
    },
    []
  );

  const resetSession = useCallback((reason: string = 'completed') => {
    socketClient.send('SESSION_RESET', {
      reason,
      wipe: true,
    });
  }, []);

  return {
    socketStatus: state.socketStatus,
    sendInput,
    requestSummary,
    confirmPatient,
    verifyNurse,
    sendNurseQuestion,
    exportRecord,
    requestInterpreter,
    resetSession,
  };
}

import { useCallback, useEffect, useState } from 'react';
import { useSession } from '../state/SessionContext';
import { socketClient } from '../services/ws/socketClient';
import { requestRecordExport } from '../services/ws/requestExport';
import {
  ErrorPayload,
  InputUpdatedServerPayload,
  InterpreterStatusPayload,
  NurseVerifiedPayload,
  PatientConfirmedPayload,
  SummaryReadyPayload,
} from '../types';

export function useSessionSocket() {
  const { state, dispatch } = useSession();
  const { sessionId, role, token } = state;
  const [socketError, setSocketError] = useState<ErrorPayload | null>(null);

  useEffect(() => {
    if (!sessionId || !role || !token) return;

    socketClient.connect({
      sessionId,
      role,
      token,
      lastSeq: 0,
    });

    const unsubStatus = socketClient.onStatusChange((status) => {
      dispatch({ type: 'SET_SOCKET_STATUS', payload: status });
    });

    setSocketError(null);
    const unsubError = socketClient.on<ErrorPayload>('ERROR', setSocketError);
    const unsubJoined = socketClient.on<{role:string}>('SESSION_JOINED',payload=>{
      if (payload.role==='patient') dispatch({type:'PATIENT_JOINED'});
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

    const unsubQuestion = socketClient.on('NURSE_QUESTION', () => {
      dispatch({ type: 'PATIENT_CONFIRMED', payload: { status: 'collecting' } });
    });

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
      unsubError();
      unsubJoined();
      unsubInput();
      unsubSummary();
      unsubQuestion();
      unsubConfirm();
      unsubVerified();
      unsubInterpreter();
      unsubReset();
      socketClient.disconnect();
    };
  }, [sessionId, role, token, dispatch]);

  const sendInput = useCallback(
    (step: string, patch: Record<string, unknown>, modality: string = 'touch', rawInput?: { type: string; text: string }, replyTo?: string) => {
      return socketClient.send('INPUT_UPDATED', {
        step,
        modality,
        patch,
        raw_input: rawInput,
        reply_to: replyTo,
      });
    },
    []
  );

  const requestSummary = useCallback(() => {
    setSocketError(null);
    socketClient.send('SUMMARY_REQUESTED', {
      language: 'vi',
      reading_level: 'simple',
    });
  }, []);

  const confirmPatient = useCallback(
    (decision: 'confirmed' | 'needs_edit' | 'unsure', confirmedFields: string[]) => {
      setSocketError(null);
    socketClient.send('PATIENT_CONFIRMED', {
        decision,
        confirmed_fields: confirmedFields,
      });
    },
    []
  );

  const verifyNurse = useCallback(
    (intakeCode: string, queueNumber: number, acknowledgedAlerts: string[] = []) => {
      setSocketError(null);
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
      return requestRecordExport(socketClient,format);
    },
    []
  );

  const resetSession = useCallback((reason: string = 'completed') => {
    const sent=socketClient.send('SESSION_RESET', {
      reason,
      wipe: true,
    });
    if (reason==='timeout') dispatch({type:'RESET_SESSION'});
    return sent;
  }, [dispatch]);

  return {
    socketStatus: state.socketStatus,
    socketError,
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

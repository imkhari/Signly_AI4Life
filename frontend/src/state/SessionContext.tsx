import React, { createContext, useContext, useEffect, useReducer } from 'react';
import { Alert, SemanticFrame, SessionStatus, TriageSummary } from '../types';
import { sessionStore } from '../services/storage/sessionStore';

export interface A11ySettings {
  largeText: boolean;
  highContrast: boolean;
}

export interface SessionState {
  sessionId: string | null;
  pairingCode: string | null;
  role: 'patient' | 'nurse' | 'doctor' | null;
  token: string | null;
  status: SessionStatus;
  socketStatus: 'disconnected' | 'connecting' | 'connected' | 'reconnecting';
  frame: SemanticFrame;
  summary: TriageSummary | null;
  alerts: Alert[];
  completeness: number;
  currentStep: string;
  interpreterRequested: boolean;
  interpreterStatus: string | null;
  queueNumber: number | null;
  intakeCode: string | null;
  a11y: A11ySettings;
}

export type SessionAction =
  | {
      type: 'INIT_SESSION';
      payload: {
        sessionId: string;
        role: 'patient' | 'nurse' | 'doctor';
        token: string;
        pairingCode?: string;
      };
    }
  | { type: 'SET_SOCKET_STATUS'; payload: SessionState['socketStatus'] }
  | {
      type: 'FRAME_UPDATED';
      payload: { frame: SemanticFrame; alerts: Alert[]; completeness: number; step: string };
    }
  | { type: 'SUMMARY_READY'; payload: TriageSummary }
  | { type: 'PATIENT_CONFIRMED'; payload: { status: SessionStatus } }
  | { type: 'NURSE_VERIFIED'; payload: { intakeCode: string; queueNumber: number } }
  | { type: 'SET_INTERPRETER_STATUS'; payload: string }
  | { type: 'TOGGLE_LARGE_TEXT' }
  | { type: 'TOGGLE_HIGH_CONTRAST' }
  | { type: 'RESET_SESSION' };

const initialEmptyFrame: SemanticFrame = {
  schema_version: '1.0',
  session_id: '',
  modality: ['touch'],
  chief_complaint: { code: null, label_vi: null, free_text: null },
  pain: { present: null, severity: null, body_regions: [] },
  allergy: { has_allergy: null, items: [] },
  extra_symptoms: [],
  uncertain_fields: [],
  field_confidence: {},
  conflicts: [],
  missing_fields: [],
};

const initialState: SessionState = {
  sessionId: sessionStore.getSessionId(),
  pairingCode: sessionStore.getPairingCode(),
  role: (sessionStore.getRole() as SessionState['role']) || null,
  token: sessionStore.getToken(),
  status: 'created',
  socketStatus: 'disconnected',
  frame: initialEmptyFrame,
  summary: null,
  alerts: [],
  completeness: 0,
  currentStep: 'chief_complaint',
  interpreterRequested: false,
  interpreterStatus: null,
  queueNumber: null,
  intakeCode: null,
  a11y: {
    largeText: sessionStore.getLargeText(),
    highContrast: sessionStore.getHighContrast(),
  },
};

function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case 'INIT_SESSION': {
      const { sessionId, role, token, pairingCode } = action.payload;
      sessionStore.setSessionId(sessionId);
      sessionStore.setRole(role);
      sessionStore.setToken(token);
      if (pairingCode) sessionStore.setPairingCode(pairingCode);

      return {
        ...state,
        sessionId,
        role,
        token,
        pairingCode: pairingCode || state.pairingCode,
        status: 'paired',
        frame: { ...state.frame, session_id: sessionId },
      };
    }
    case 'SET_SOCKET_STATUS':
      return { ...state, socketStatus: action.payload };

    case 'FRAME_UPDATED':
      return {
        ...state,
        frame: action.payload.frame,
        alerts: action.payload.alerts,
        completeness: action.payload.completeness,
        currentStep: action.payload.step || state.currentStep,
        status: state.status === 'paired' ? 'collecting' : state.status,
      };

    case 'SUMMARY_READY':
      return {
        ...state,
        summary: action.payload,
        status: 'summary_ready',
      };

    case 'PATIENT_CONFIRMED':
      return {
        ...state,
        status: action.payload.status,
      };

    case 'NURSE_VERIFIED':
      return {
        ...state,
        intakeCode: action.payload.intakeCode,
        queueNumber: action.payload.queueNumber,
        status: 'nurse_verified',
      };

    case 'SET_INTERPRETER_STATUS':
      return {
        ...state,
        interpreterRequested: true,
        interpreterStatus: action.payload,
      };

    case 'TOGGLE_LARGE_TEXT': {
      const next = !state.a11y.largeText;
      sessionStore.setLargeText(next);
      return { ...state, a11y: { ...state.a11y, largeText: next } };
    }

    case 'TOGGLE_HIGH_CONTRAST': {
      const next = !state.a11y.highContrast;
      sessionStore.setHighContrast(next);
      return { ...state, a11y: { ...state.a11y, highContrast: next } };
    }

    case 'RESET_SESSION':
      sessionStore.wipe();
      return {
        ...initialState,
        sessionId: null,
        pairingCode: null,
        token: null,
        role: null,
        frame: initialEmptyFrame,
        a11y: state.a11y,
      };

    default:
      return state;
  }
}

interface SessionContextType {
  state: SessionState;
  dispatch: React.Dispatch<SessionAction>;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(sessionReducer, initialState);

  // Áp dụng class css lên thẻ <html> cho Accessibility
  useEffect(() => {
    const root = document.documentElement;
    if (state.a11y.largeText) {
      root.classList.add('large-font');
    } else {
      root.classList.remove('large-font');
    }

    if (state.a11y.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
  }, [state.a11y]);

  return (
    <SessionContext.Provider value={{ state, dispatch }}>
      {children}
    </SessionContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export function useSession(): SessionContextType {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}

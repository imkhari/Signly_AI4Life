const KEYS = {
  SESSION_ID: 'ai4care_session_id',
  ROLE: 'ai4care_role',
  TOKEN: 'ai4care_token',
  PAIRING_CODE: 'ai4care_pairing_code',
  LAST_SEQ: 'ai4care_last_seq',
  A11Y_LARGE_TEXT: 'ai4care_a11y_large_text',
  A11Y_HIGH_CONTRAST: 'ai4care_a11y_high_contrast',
} as const;

export class SessionStorageManager {
  getSessionId(): string | null {
    return sessionStorage.getItem(KEYS.SESSION_ID);
  }

  setSessionId(id: string): void {
    sessionStorage.setItem(KEYS.SESSION_ID, id);
  }

  getRole(): string | null {
    return sessionStorage.getItem(KEYS.ROLE);
  }

  setRole(role: string): void {
    sessionStorage.setItem(KEYS.ROLE, role);
  }

  getToken(): string | null {
    return sessionStorage.getItem(KEYS.TOKEN);
  }

  setToken(token: string): void {
    sessionStorage.setItem(KEYS.TOKEN, token);
  }

  getPairingCode(): string | null {
    return sessionStorage.getItem(KEYS.PAIRING_CODE);
  }

  setPairingCode(code: string): void {
    sessionStorage.setItem(KEYS.PAIRING_CODE, code);
  }

  getLastSeq(): number {
    const val = sessionStorage.getItem(KEYS.LAST_SEQ);
    return val ? parseInt(val, 10) : 0;
  }

  setLastSeq(seq: number): void {
    sessionStorage.setItem(KEYS.LAST_SEQ, seq.toString());
  }

  getLargeText(): boolean {
    return sessionStorage.getItem(KEYS.A11Y_LARGE_TEXT) === 'true';
  }

  setLargeText(enabled: boolean): void {
    sessionStorage.setItem(KEYS.A11Y_LARGE_TEXT, enabled.toString());
  }

  getHighContrast(): boolean {
    return sessionStorage.getItem(KEYS.A11Y_HIGH_CONTRAST) === 'true';
  }

  setHighContrast(enabled: boolean): void {
    sessionStorage.setItem(KEYS.A11Y_HIGH_CONTRAST, enabled.toString());
  }

  /**
   * Xóa sạch toàn bộ dữ liệu phiên (Privacy-by-design)
   */
  wipe(): void {
    sessionStorage.clear();
  }
}

export const sessionStore = new SessionStorageManager();


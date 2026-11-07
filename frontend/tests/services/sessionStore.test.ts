import { describe, it, expect, beforeEach } from 'vitest';
import { sessionStore } from '../../src/services/storage/sessionStore';

describe('sessionStore (Privacy-by-design)', () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  it('stores and retrieves session data only from sessionStorage', () => {
    sessionStore.setSessionId('sess-123');
    sessionStore.setToken('tok-456');
    sessionStore.setRole('patient');

    expect(sessionStore.getSessionId()).toBe('sess-123');
    expect(sessionStore.getToken()).toBe('tok-456');
    expect(sessionStore.getRole()).toBe('patient');

    // Confirm NOTHING is stored in localStorage
    expect(localStorage.length).toBe(0);
  });

  it('wipe() completely empties sessionStorage', () => {
    sessionStore.setSessionId('sess-123');
    sessionStore.setPairingCode('AB2345');
    expect(sessionStore.getSessionId()).toBe('sess-123');

    sessionStore.wipe();
    expect(sessionStore.getSessionId()).toBeNull();
    expect(sessionStore.getPairingCode()).toBeNull();
    expect(sessionStorage.length).toBe(0);
  });
});


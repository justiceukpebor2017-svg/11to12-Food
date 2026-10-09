/**
 * Real-Time Single Concurrent Session Management Service
 * Ensures each user and admin account can only be logged in from ONE device/browser at a time.
 * Automatically detects when another device signs in, alerts the user, and manages safe session transitions.
 */

import { ActiveSessionRecord } from '../types';
import {
  saveSessionToFirestore,
  subscribeToSessionInFirestore,
  releaseSessionInFirestore,
  db,
  doc,
  getDoc,
} from './firebase';
import { apiUrl } from '../utils/apiConfig';
import { liveSync } from './liveSyncService';

const SESSION_TOKEN_KEY = '11to12_active_session_token';
const LAST_CLAIMED_KEY = '11to12_last_active_session_payload';

// BroadcastChannel for instant cross-tab / cross-window synchronization within the same browser
const sessionBroadcastChannel: BroadcastChannel | null =
  typeof window !== 'undefined' && 'BroadcastChannel' in window
    ? new BroadcastChannel('11to12_active_sessions_channel')
    : null;

/**
 * Generates human-friendly device and browser descriptions
 */
export function getDeviceDescriptor(): string {
  if (typeof window === 'undefined') return 'Server';
  const ua = navigator.userAgent;
  let browser = 'Browser';
  let os = 'Device';

  // Detect OS
  if (/iPhone|iPad|iPod/i.test(ua)) os = 'iPhone / iPad';
  else if (/Android/i.test(ua)) os = 'Android Mobile';
  else if (/Macintosh|Mac OS X/i.test(ua)) os = 'Mac Desktop';
  else if (/Windows/i.test(ua)) os = 'Windows PC';
  else if (/Linux/i.test(ua)) os = 'Linux Device';

  // Detect Browser
  if (/Edg\//i.test(ua)) browser = 'Microsoft Edge';
  else if (/Chrome\//i.test(ua)) browser = 'Google Chrome';
  else if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) browser = 'Apple Safari';
  else if (/Firefox\//i.test(ua)) browser = 'Mozilla Firefox';

  return `${browser} on ${os}`;
}

/**
 * Creates or retrieves the unique session token for this browser session
 */
export function getOrCreateSessionToken(prefix: string): string {
  if (typeof window === 'undefined') return `${prefix}_${Date.now()}`;
  try {
    let token = sessionStorage.getItem(SESSION_TOKEN_KEY);
    if (!token) {
      token = `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      sessionStorage.setItem(SESSION_TOKEN_KEY, token);
    }
    return token;
  } catch {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}

/**
 * Gets the current device's active session token if any
 */
export function getCurrentSessionToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return sessionStorage.getItem(SESSION_TOKEN_KEY);
  } catch {
    return null;
  }
}

/**
 * Checks if an active session already exists for this account on a DIFFERENT device/browser
 */
export async function checkExistingActiveSession(userId: string): Promise<ActiveSessionRecord | null> {
  const currentToken = getCurrentSessionToken();

  // 1. Try Backend server API first
  try {
    const res = await fetch(apiUrl(`/api/sessions/${encodeURIComponent(userId)}`));
    if (res.ok) {
      const data = await res.json();
      if (data?.session && data.session.activeSessionId) {
        if (!currentToken || data.session.activeSessionId !== currentToken) {
          return data.session as ActiveSessionRecord;
        }
      }
    }
  } catch {}

  // 2. Check Firestore as real-time fallback
  try {
    const snap = await getDoc(doc(db, 'sessions', userId));
    if (snap.exists()) {
      const data = snap.data() as ActiveSessionRecord;
      if (data && data.activeSessionId) {
        if (!currentToken || data.activeSessionId !== currentToken) {
          return data;
        }
      }
    }
  } catch {}

  // 3. Check localStorage for local browser sessions
  try {
    const raw = localStorage.getItem(LAST_CLAIMED_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as ActiveSessionRecord;
      if (parsed.userId === userId && parsed.activeSessionId !== currentToken) {
        return parsed;
      }
    }
  } catch {}

  return null;
}

/**
 * Claims the single active session for this account across all channels
 */
export async function claimActiveSession(
  userId: string,
  role: 'admin' | 'subscriber',
  userEmail?: string
): Promise<string> {
  const token = getOrCreateSessionToken(role === 'admin' ? 'admin' : 'cust');
  const deviceInfo = getDeviceDescriptor();

  const sessionPayload: ActiveSessionRecord = {
    id: userId,
    userId,
    userEmail,
    role,
    activeSessionId: token,
    deviceInfo,
    claimedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Persist locally for instant cross-tab detection
  try {
    localStorage.setItem(LAST_CLAIMED_KEY, JSON.stringify(sessionPayload));
  } catch {}

  // Broadcast instantly to all tabs/windows in this browser
  if (sessionBroadcastChannel) {
    try {
      sessionBroadcastChannel.postMessage({
        type: 'CLAIMED',
        session: sessionPayload,
      });
    } catch {}
  }

  // 1. Claim in Firestore Real-time Database
  saveSessionToFirestore(sessionPayload).catch((err) => {
    console.warn('[SessionService] Firestore claim notice:', err);
  });

  // 2. Claim in Live Backend Server
  try {
    fetch(apiUrl('/api/sessions/claim'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sessionPayload),
    }).catch(() => {});
  } catch {}

  return token;
}

/**
 * Releases the active session upon user-initiated clean sign out
 */
export async function releaseActiveSession(userId: string, token: string): Promise<void> {
  try {
    localStorage.removeItem(LAST_CLAIMED_KEY);
  } catch {}

  if (sessionBroadcastChannel) {
    try {
      sessionBroadcastChannel.postMessage({
        type: 'RELEASED',
        session: { userId, activeSessionId: token },
      });
    } catch {}
  }

  // 1. Release in Firestore
  releaseSessionInFirestore(userId, token).catch(() => {});

  // 2. Release in Backend Server
  try {
    fetch(apiUrl('/api/sessions/release'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, activeSessionId: token }),
    }).catch(() => {});
  } catch {}

  try {
    sessionStorage.removeItem(SESSION_TOKEN_KEY);
  } catch {}
}

/**
 * Subscribes to real-time session changes across ALL channels:
 * 1. BroadcastChannel (0ms, same origin tabs/windows)
 * 2. Window storage events (cross-tab storage)
 * 3. LiveSync SSE Server-Sent Events (<50ms, multi-device)
 * 4. Firestore Real-time Snapshot (<300ms, cross-device/network)
 * 5. Periodic polling (every 5 seconds fallback)
 *
 * Calls onConflict whenever another device or browser logs into this account with a different token.
 */
export function listenToSessionConflict(
  userId: string,
  mySessionToken: string,
  onConflict: (remoteSession: ActiveSessionRecord) => void
): () => void {
  let isDisposed = false;

  const handleCandidate = (remote: ActiveSessionRecord | null | undefined) => {
    if (isDisposed || !remote) return;
    if (remote.userId === userId && remote.activeSessionId && remote.activeSessionId !== mySessionToken) {
      console.warn('[SessionService] Single concurrent session conflict detected:', remote);
      onConflict(remote);
    }
  };

  // 1. BroadcastChannel listener (instant same-browser cross-tab)
  const handleBroadcast = (evt: MessageEvent) => {
    if (evt.data?.type === 'CLAIMED' && evt.data?.session) {
      handleCandidate(evt.data.session);
    }
  };
  if (sessionBroadcastChannel) {
    sessionBroadcastChannel.addEventListener('message', handleBroadcast);
  }

  // 2. Storage event listener (same browser cross-tab fallback)
  const handleStorage = (evt: StorageEvent) => {
    if (evt.key === LAST_CLAIMED_KEY && evt.newValue) {
      try {
        const parsed = JSON.parse(evt.newValue);
        handleCandidate(parsed);
      } catch {}
    }
  };
  window.addEventListener('storage', handleStorage);

  // 3. LiveSync SSE listener
  const unsubLiveSync = liveSync.onSessionEvent?.((evt: any) => {
    if (evt.type === 'CLAIMED' && evt.session) {
      handleCandidate(evt.session);
    }
  });

  // 4. Firestore Realtime Snapshot
  const unsubFirestore = subscribeToSessionInFirestore(userId, (remote) => {
    handleCandidate(remote);
  });

  // 5. Periodic Polling fallback (every 5 seconds)
  const pollTimer = setInterval(() => {
    if (isDisposed) return;
    fetch(apiUrl(`/api/sessions/${encodeURIComponent(userId)}`))
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json?.session) {
          handleCandidate(json.session);
        }
      })
      .catch(() => {});
  }, 5000);

  return () => {
    isDisposed = true;
    if (sessionBroadcastChannel) {
      sessionBroadcastChannel.removeEventListener('message', handleBroadcast);
    }
    window.removeEventListener('storage', handleStorage);
    if (unsubLiveSync) unsubLiveSync();
    unsubFirestore();
    clearInterval(pollTimer);
  };
}

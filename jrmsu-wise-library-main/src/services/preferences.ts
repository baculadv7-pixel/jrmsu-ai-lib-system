export type UIState = {
  sidebarCollapsed?: boolean;
  aiView?: 'compact' | 'windowed' | 'fullscreen';
  lastPage?: string;
  notificationsOpen?: boolean;
};

const PREFIX = 'jrmsu_prefs_';
const CHANNEL = 'jrmsu_prefs_channel';

function read(userId: string): UIState {
  try {
    const raw = localStorage.getItem(PREFIX + userId);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function write(userId: string, state: UIState) {
  try { localStorage.setItem(PREFIX + userId, JSON.stringify(state)); } catch { /* noop */ }
  try { const ch = new BroadcastChannel(CHANNEL); ch.postMessage({ type: 'prefs', userId }); ch.close(); } catch { /* noop */ }
}

export const PreferenceService = {
  load(userId: string): UIState { return read(userId); },
  save(userId: string, patch: UIState) {
    const cur = read(userId);
    write(userId, { ...cur, ...patch });
  },
  subscribe(cb: () => void) { let ch: BroadcastChannel | null = null; try { ch = new BroadcastChannel(CHANNEL); ch.onmessage = () => cb(); } catch { /* noop */ } return () => { try { if (ch) ch.close(); } catch { /* noop */ } }; }
};

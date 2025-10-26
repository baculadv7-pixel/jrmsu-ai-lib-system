export type ActivityAction =
  | 'login' | 'logout' | 'password_change' | 'email_update' | 'mobile_update'
  | 'profile_update' | 'qr_download' | 'qr_regenerate'
  | '2fa_enable' | '2fa_disable' | 'settings_update';

export interface ActivityRecord {
  id: string;        // ACT-<timestamp>
  userId: string;
  action: ActivityAction;
  details?: string;
  timestamp: string; // ISO datetime
}

const KEY = 'jrmsu_activity_log';
const CHANNEL = 'jrmsu_activity_channel';

function readAll(): ActivityRecord[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as ActivityRecord[];
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}

function writeAll(items: ActivityRecord[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
}

function broadcast() {
  try {
    const ch = new BroadcastChannel(CHANNEL);
    ch.postMessage({ type: 'refresh' });
    ch.close();
  } catch { /* noop */ }
}

export const ActivityService = {
  log(userId: string, action: ActivityAction, details?: string): ActivityRecord {
    const rec: ActivityRecord = {
      id: `ACT-${Date.now()}`,
      userId,
      action,
      details,
      timestamp: new Date().toISOString(),
    };
    const all = readAll();
    all.push(rec);
    // keep only last 1000
    writeAll(all.slice(-1000));
    broadcast();
    return rec;
  },
  list(userId?: string): ActivityRecord[] {
    const all = readAll();
    const filtered = userId ? all.filter(a => a.userId === userId) : all;
    return filtered.sort((a,b)=> a.timestamp < b.timestamp ? 1 : -1);
  },
  subscribe(cb: () => void) {
    let ch: BroadcastChannel | null = null;
    try {
      ch = new BroadcastChannel(CHANNEL);
      ch.onmessage = () => cb();
    } catch { /* noop */ }
    return () => { try { if (ch) ch.close(); } catch { /* noop */ } };
  }
};

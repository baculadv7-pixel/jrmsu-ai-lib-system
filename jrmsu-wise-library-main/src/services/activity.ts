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

import { API } from "@/config/api";

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
    // Attempt backend sync (fire-and-forget)
    try { fetch(`${API.BACKEND.BASE}/api/activity`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, action, details }) }); } catch {}
    return rec;
  },
  list(userId?: string): ActivityRecord[] {
    const all = readAll();
    const filtered = userId ? all.filter(a => a.userId === userId) : all;
    return filtered.sort((a,b)=> a.timestamp < b.timestamp ? 1 : -1);
  },
  subscribe(cb: () => void) {
    let ch: BroadcastChannel | null = null;
    let timer: any = null;
    async function syncFromBackend() {
      try {
        const r = await fetch(`${API.BACKEND.BASE}/api/activity`);
        if (!r.ok) return;
        const data = await r.json();
        const items = (data?.items || []) as any[];
        if (Array.isArray(items) && items.length) {
          const merged = [...readAll(), ...items.map((a:any)=>({ id: a.id, userId: a.userId, action: a.action, details: a.details, timestamp: a.timestamp }))];
          const map = new Map<string, ActivityRecord>();
          merged.forEach(m => map.set(m.id, m));
          const next = Array.from(map.values()).sort((a,b)=> a.timestamp < b.timestamp ? 1 : -1).slice(-1000);
          writeAll(next);
          broadcast();
        }
      } catch { /* noop */ }
    }
    try {
      ch = new BroadcastChannel(CHANNEL);
      ch.onmessage = () => cb();
    } catch { /* noop */ }
    // periodic sync
    timer = setInterval(() => { syncFromBackend().then(cb).catch(()=>{}); }, 5000);
    syncFromBackend().then(cb).catch(()=>{});
    return () => { try { if (ch) ch.close(); } catch { /* noop */ } if (timer) clearInterval(timer); };
  }
};

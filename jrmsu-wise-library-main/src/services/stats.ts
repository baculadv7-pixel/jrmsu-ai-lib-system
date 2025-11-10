export interface LiveStats {
  totalBooks: number;
  activeBorrowers: number;
  borrowedToday: number;
  overdue: number;
}

const CHANNEL = 'jrmsu_stats_channel';

import { BooksService } from './books'
import { BorrowService } from './borrow'
import { DashboardApi, type SummaryResp } from './dashboardApi'

function computeLocalStats(): LiveStats {
  const books = BooksService.list();
  const borrows = BorrowService.list();
  const totalBooks = books.length;
  const activeBorrowers = new Set(borrows.filter(b => b.status !== 'returned').map(b => b.studentId)).size;
  const todayISO = new Date().toISOString().slice(0,10);
  const borrowedToday = borrows.filter(b => b.borrowDate === todayISO).length;
  const overdue = borrows.filter(b => b.status === 'overdue').length;
  return { totalBooks, activeBorrowers, borrowedToday, overdue };
}

function broadcast(stats: LiveStats) {
  try {
    const ch = new BroadcastChannel(CHANNEL);
    ch.postMessage({ type: 'stats', payload: stats });
    ch.close();
  } catch { /* noop */ }
}

let timer: number | null = null as any;
let lastBackend: LiveStats | null = null;

async function tryFetchBackend(): Promise<LiveStats | null> {
  try {
    const s: SummaryResp = await DashboardApi.summary();
    return { totalBooks: s.totalBooks, activeBorrowers: s.activeBorrowers, borrowedToday: s.borrowedToday, overdue: s.overdue };
  } catch {
    return null;
  }
}

export function validateStatsConsistency() {
  const books = BooksService.list();
  const borrows = BorrowService.list();
  // Basic invariants
  const totalAvailable = books.reduce((a,b)=> a + (b.available ?? 0), 0);
  const totalCopies = books.reduce((a,b)=> a + (b.copies ?? 0), 0);
  const active = borrows.filter(b=> b.status !== 'returned').length;
  const ok = totalAvailable <= totalCopies && active <= borrows.length;
  return { ok, totalAvailable, totalCopies, active };
}

export const StatsService = {
  get(): LiveStats {
    return lastBackend ?? computeLocalStats();
  },
  start(intervalMs = 5000) {
    if (timer) return;
    timer = setInterval(async () => {
      const backend = await tryFetchBackend();
      if (backend) {
        lastBackend = backend;
        broadcast(backend);
      } else {
        broadcast(computeLocalStats());
      }
    }, intervalMs) as any;
    // also emit immediately
    (async () => {
      const backend = await tryFetchBackend();
      if (backend) {
        lastBackend = backend;
        broadcast(backend);
      } else {
        broadcast(computeLocalStats());
      }
    })();
  },
  stop() {
    if (timer) {
      clearInterval(timer as any);
      timer = null as any;
    }
  },
  subscribe(cb: (stats: LiveStats) => void) {
    let ch: BroadcastChannel | null = null;
    try {
      ch = new BroadcastChannel(CHANNEL);
      ch.onmessage = (e) => {
        if (e.data?.type === 'stats') cb(e.data.payload as LiveStats);
      };
    } catch { /* noop */ }
    // fire once with current
    cb(lastBackend ?? computeLocalStats());
    return () => { try { if (ch) ch.close(); } catch { /* noop */ } };
  }
}

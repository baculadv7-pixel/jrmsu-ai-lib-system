export interface LiveStats {
  totalBooks: number;
  activeBorrowers: number;
  borrowedToday: number;
  overdue: number;
}

const CHANNEL = 'jrmsu_stats_channel';

import { BooksService } from './books'
import { BorrowService } from './borrow'

function computeStats(): LiveStats {
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
    return computeStats();
  },
  start(intervalMs = 5000) {
    if (timer) return;
    timer = setInterval(() => {
      broadcast(computeStats());
    }, intervalMs) as any;
    // also emit immediately
    broadcast(computeStats());
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
    cb(computeStats());
    return () => { try { if (ch) ch.close(); } catch { /* noop */ } };
  }
}
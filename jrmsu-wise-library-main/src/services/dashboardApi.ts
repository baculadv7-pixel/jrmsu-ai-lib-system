// Dashboard API client for backend-driven overlays
export type DateGroups<T> = Record<string, T[]>;

export interface TotalBooksResp {
  total: number;
  data: Array<{ book_id: string; title: string; author: string; category: string }>; 
}

export interface ActiveBorrowerRow { timestamp: string; user_id: string; fullname: string; course: string; year: string | number; block: string }
export interface ActiveBorrowersResp { data: DateGroups<ActiveBorrowerRow> }

export interface BorrowedTodayRow { timestamp: string; book_id: string; title: string; author: string; category: string }
export interface BorrowedTodayResp { data: DateGroups<BorrowedTodayRow> }

export interface OverdueRow { timestamp: string; user_id: string; fullname: string; course: string; year: string | number; block: string }
export interface OverdueResp { data: DateGroups<OverdueRow> }

import { API } from "@/config/api";

async function getJSON<T>(path: string): Promise<T> {
  const url = `${API.BACKEND.BASE}${path}`;
  const r = await fetch(url, { credentials: 'include' });
  if (!r.ok) throw new Error(`Request failed: ${r.status}`);
  return r.json();
}

export interface SummaryResp { totalBooks: number; activeBorrowers: number; borrowedToday: number; overdue: number }

export const DashboardApi = {
  summary(): Promise<SummaryResp> {
    return getJSON('/api/dashboard/summary');
  },
  totalBooks(): Promise<TotalBooksResp> {
    return getJSON('/api/dashboard/total-books');
  },
  activeBorrowers(): Promise<ActiveBorrowersResp> {
    return getJSON('/api/dashboard/active-borrowers');
  },
  borrowedToday(): Promise<BorrowedTodayResp> {
    return getJSON('/api/dashboard/books-borrowed-today');
  },
  overdueReturns(): Promise<OverdueResp> {
    return getJSON('/api/dashboard/overdue-returns');
  },
};

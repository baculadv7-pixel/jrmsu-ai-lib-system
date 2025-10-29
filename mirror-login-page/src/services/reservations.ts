export interface ReservationRecord {
  id: string; // RV-<timestamp>
  bookId: string;
  bookTitle: string;
  studentId: string;
  studentName: string;
  createdAt: string; // ISO datetime
}

const KEY = "jrmsu_reservations";

function readAll(): ReservationRecord[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as ReservationRecord[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function writeAll(items: ReservationRecord[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
}

export const ReservationsService = {
  list(): ReservationRecord[] {
    return readAll().sort((a,b)=> (a.createdAt < b.createdAt ? 1 : -1));
  },
  add(bookId: string, bookTitle: string, studentId: string, studentName: string): ReservationRecord {
    const rec: ReservationRecord = {
      id: `RV-${Date.now()}`,
      bookId,
      bookTitle,
      studentId,
      studentName,
      createdAt: new Date().toISOString(),
    };
    const all = readAll();
    all.unshift(rec);
    writeAll(all);
    return rec;
  },
  byBook(bookId: string): ReservationRecord[] {
    return readAll().filter(r => r.bookId === bookId);
  },
  clear() { writeAll([]); }
};

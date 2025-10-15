import { BooksService, type BookRecord } from "@/services/books";

export type BorrowStatus = "borrowed" | "returned" | "overdue";

export interface BorrowRecord {
  id: string; // BR-<timestamp>
  bookId: string;
  bookTitle: string;
  studentId: string;
  borrowDate: string; // ISO date
  dueDate: string; // ISO date
  returnDate?: string; // ISO date
  status: BorrowStatus;
}

const KEY = "jrmsu_borrow_history";

function readAll(): BorrowRecord[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as BorrowRecord[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function writeAll(records: BorrowRecord[]) {
  localStorage.setItem(KEY, JSON.stringify(records));
}

export function calculateDueDate(start: Date, daysToBorrow = 7): Date {
  // Add days while skipping Saturdays (6) and Sundays (0)
  let added = 0;
  const date = new Date(start);
  while (added < daysToBorrow) {
    date.setDate(date.getDate() + 1);
    const day = date.getDay();
    if (day !== 0 && day !== 6) {
      added++;
    }
  }
  return date;
}

function normalizeStatuses(records: BorrowRecord[]): BorrowRecord[] {
  const today = new Date();
  return records.map((r) => {
    if (!r.returnDate) {
      const due = new Date(r.dueDate);
      if (today > due) return { ...r, status: "overdue" };
    }
    return r;
  });
}

export const BorrowService = {
  list(): BorrowRecord[] {
    return normalizeStatuses(readAll());
  },
  borrow(bookId: string, studentId: string): BorrowRecord {
    const book = BooksService.get(bookId);
    if (!book) throw new Error("Book not found");
    if (book.available <= 0 || book.status !== "available") throw new Error("Book unavailable");

    const borrowDate = new Date();
    const due = calculateDueDate(borrowDate, 7);
    const record: BorrowRecord = {
      id: `BR-${Date.now()}`,
      bookId: book.id,
      bookTitle: book.title,
      studentId,
      borrowDate: borrowDate.toISOString().slice(0, 10),
      dueDate: due.toISOString().slice(0, 10),
      status: "borrowed",
    };
    const all = readAll();
    all.unshift(record);
    writeAll(all);

    // Update book availability
    BooksService.update(book.id, { available: Math.max(0, book.available - 1), status: book.available - 1 <= 0 ? "unavailable" : book.status });
    return record;
  },
  returnBook(recordId: string) {
    const all = readAll();
    const idx = all.findIndex((r) => r.id === recordId);
    if (idx === -1) throw new Error("Record not found");
    if (all[idx].returnDate) return; // already returned
    all[idx] = { ...all[idx], returnDate: new Date().toISOString().slice(0, 10), status: "returned" };
    writeAll(all);

    // Increment availability
    const book = BooksService.get(all[idx].bookId);
    if (book) {
      const available = Math.min(book.copies, (book.available ?? 0) + 1);
      BooksService.update(book.id, { available, status: available > 0 ? "available" : book.status });
    }
  },
};



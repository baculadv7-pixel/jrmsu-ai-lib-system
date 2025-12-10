export type BookStatus = "available" | "borrowed" | "unavailable";

export interface BookRecord {
  id: string; // Book Code
  title: string;
  author: string;
  category: string;
  isbn?: string;
  shelf?: string;
  copies: number;
  available: number;
  status: BookStatus;
  [key: string]: any; // Dynamic columns support
}

export interface CustomColumn {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date';
}

const BOOKS_KEY = "jrmsu_books";
const BOOKS_TS_KEY = "jrmsu_books_ts";
const CUSTOM_COLUMNS_KEY = "jrmsu_book_custom_columns";

function readBooks(): BookRecord[] {
  try {
    const raw = localStorage.getItem(BOOKS_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as BookRecord[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function writeBooks(books: BookRecord[]) {
  localStorage.setItem(BOOKS_KEY, JSON.stringify(books));
  localStorage.setItem(BOOKS_TS_KEY, String(Date.now()));
}

async function fetchBackendBooksAndCache() {
  try {
    const r = await fetch(`${API.BACKEND.BASE}/api/books`, { credentials: 'include' });
    if (!r.ok) return;
    const data = await r.json();
    const items = (data.items || []) as any[];
    const mapped: BookRecord[] = items.map((b: any) => ({
      id: b.id,
      title: b.title,
      author: b.author,
      category: b.category,
      isbn: b.isbn,
      copies: b.total_copies ?? b.copies ?? 1,
      available: b.available_copies ?? b.available ?? 1,
      status: (b.status || 'available') as any
    }));
    if (Array.isArray(mapped) && mapped.length >= 0) writeBooks(mapped);
  } catch {}
}

import { API } from "@/config/api";

export const BooksService = {
  list(): BookRecord[] {
    // Background-refresh from backend if stale (>60s)
    try {
      const ts = Number(localStorage.getItem(BOOKS_TS_KEY) || '0');
      if (!ts || Date.now() - ts > 60_000) {
        fetchBackendBooksAndCache();
      }
    } catch {}
    return readBooks();
  },
  get(id: string): BookRecord | undefined {
    return readBooks().find((b) => b.id === id);
  },
  create(book: BookRecord) {
    // Fire-and-forget backend sync to enable realtime events
    (async () => {
      try {
        await fetch(`${API.BACKEND.BASE}/api/books`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            id: book.id,
            title: book.title,
            author: book.author,
            category: book.category,
            total_copies: book.copies,
            available_copies: book.available,
            status: book.status,
            isbn: book.isbn,
          })
        });
      } catch {}
    })();
    const books = readBooks();
    if (books.some((b) => b.id === book.id)) {
      throw new Error("Book code already exists");
    }
    books.push({ ...book, createdAt: Date.now() });
    writeBooks(books);
  },
  async update(id: string, updates: Partial<BookRecord>) {
    // First, attempt to persist the update to the backend so changes survive
    // refresh/restart and are visible across all clients.
    try {
      const payload: any = {
        title: updates.title,
        author: updates.author,
        category: updates.category,
        isbn: updates.isbn,
        shelf: updates.shelf,
        total_copies: updates.copies,
        available_copies: updates.available,
        status: updates.status,
      };
      // Remove undefined keys so we don't accidentally overwrite with nulls
      Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);

      const resp = await fetch(`${API.BACKEND.BASE}/api/books/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!resp.ok) {
        try {
          const err = await resp.json();
          throw new Error(err?.error || 'Failed to update book on server');
        } catch {
          throw new Error('Failed to update book on server');
        }
      }
    } catch (e) {
      // Log to console but still update local cache so UI remains responsive;
      // remote failure will be visible next time data is fetched.
      console.error('BooksService.update backend error:', e);
    }

    // Update local cached copy so UI reflects edits immediately.
    const books = readBooks();
    const idx = books.findIndex((b) => b.id === id);
    if (idx === -1) throw new Error("Book not found");
    books[idx] = { ...books[idx], ...updates };
    writeBooks(books);
  },
  async remove(id: string): Promise<void> {
    // Ensure backend delete succeeds before mutating local cache
    let ok = false;
    let errorMessage = '';

    try {
      const resp = await fetch(`${API.BACKEND.BASE}/api/books/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (resp.ok) {
        ok = true;
      } else {
        try {
          const err = await resp.json();
          errorMessage = err?.error || resp.statusText || 'Failed to delete book on server';
        } catch {
          errorMessage = resp.statusText || 'Failed to delete book on server';
        }
      }
    } catch (e: any) {
      errorMessage = e?.message || 'Network error while deleting book';
    }

    if (!ok) {
      throw new Error(errorMessage || 'Failed to delete book on server');
    }

    const books = readBooks().filter((b) => b.id !== id);
    writeBooks(books);
  },
  
  // Custom columns management
  getCustomColumns(): CustomColumn[] {
    try {
      const raw = localStorage.getItem(CUSTOM_COLUMNS_KEY);
      if (!raw) return [];
      const cols = JSON.parse(raw) as CustomColumn[];
      return Array.isArray(cols) ? cols : [];
    } catch {
      return [];
    }
  },
  
  addCustomColumn(column: CustomColumn) {
    const columns = this.getCustomColumns();
    if (columns.some(c => c.key === column.key)) {
      throw new Error("Column already exists");
    }
    columns.push(column);
    localStorage.setItem(CUSTOM_COLUMNS_KEY, JSON.stringify(columns));
    
    // Update all existing books with the new column (default empty value)
    const books = readBooks();
    const defaultValue = column.type === 'number' ? 0 : '';
    const updated = books.map(book => ({
      ...book,
      [column.key]: book[column.key] ?? defaultValue
    }));
    writeBooks(updated);
  },
  
  removeCustomColumn(key: string) {
    const columns = this.getCustomColumns().filter(c => c.key !== key);
    localStorage.setItem(CUSTOM_COLUMNS_KEY, JSON.stringify(columns));
    
    // Remove the column from all books
    const books = readBooks();
    const updated = books.map(book => {
      const { [key]: removed, ...rest } = book;
      return rest;
    });
    writeBooks(updated);
  },
  ensureSeed() {
    // Only seed demo data when explicitly enabled (to avoid re-creating sample books in production)
    const enableSeed =
      typeof import.meta !== 'undefined' &&
      (import.meta as any).env &&
      (import.meta as any).env.VITE_ENABLE_SAMPLE_BOOKS === 'true';

    if (!enableSeed) return;

    const books = readBooks();
    if (books.length === 0) {
      writeBooks([
        {
          id: "CS-AI-001",
          title: "Introduction to Artificial Intelligence",
          author: "Stuart Russell, Peter Norvig",
          category: "Computer Science",
          isbn: "978-0134610993",
          copies: 5,
          available: 3,
          status: "available",
          shelf: "A1-05",
          createdAt: Date.now(),
        },
      ]);
    }
  },
};

export function buildBookQrPayload(book: BookRecord) {
  return JSON.stringify({
    t: "BOOK",
    id: book.id,
    title: book.title,
    author: book.author,
    category: book.category,
    isbn: book.isbn,
  });
}



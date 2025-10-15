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
}

const BOOKS_KEY = "jrmsu_books";

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
}

export const BooksService = {
  list(): BookRecord[] {
    return readBooks();
  },
  get(id: string): BookRecord | undefined {
    return readBooks().find((b) => b.id === id);
  },
  create(book: BookRecord) {
    const books = readBooks();
    if (books.some((b) => b.id === book.id)) {
      throw new Error("Book code already exists");
    }
    books.push(book);
    writeBooks(books);
  },
  update(id: string, updates: Partial<BookRecord>) {
    const books = readBooks();
    const idx = books.findIndex((b) => b.id === id);
    if (idx === -1) throw new Error("Book not found");
    books[idx] = { ...books[idx], ...updates };
    writeBooks(books);
  },
  remove(id: string) {
    const books = readBooks().filter((b) => b.id !== id);
    writeBooks(books);
  },
  ensureSeed() {
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



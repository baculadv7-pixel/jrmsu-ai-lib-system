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



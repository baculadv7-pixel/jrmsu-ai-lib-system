// merged react imports below
import { Search, Filter, Plus, LayoutList, Grid3X3, Rows3, FileText, Sparkles, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Layout/Navbar";
import Sidebar from "@/components/Layout/Sidebar";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useMemo, useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { BooksService, type BookRecord } from "@/services/books";
import { NotificationsService } from "@/services/notifications";
import { ReservationsService } from "@/services/reservations";
import { useToast } from "@/hooks/use-toast";
import { API } from "@/config/api";
import QRCodeDisplay from "@/components/qr/QRCodeDisplay";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { aiSearchService, type SearchSuggestion, type SearchResult } from "@/services/aiSearchService";

const API_BASE = API.BACKEND.BASE;

type BackendBorrowRecord = {
  borrowId: string;
  userId: string;
  userType: string;
  bookId: string;
  bookTitle: string;
  borrowedAt: string;
  dueDate: string;
  returnedAt: string | null;
  status: 'borrowed' | 'overdue';
};

type BackendReservationRecord = {
  reservationId: string;
  userId: string;
  userType: string;
  bookId: string;
  bookTitle: string;
  reservedAt: string;
  quantity?: number;
};

const Books = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const userType: "student" | "admin" = user?.role ?? "student";
  const [searchQuery, setSearchQuery] = useState("");
  const [books, setBooks] = useState<BookRecord[]>([]);
  const [viewMode, setViewMode] = useState<'list'|'grid'|'compact'|'detailed'>('list');
  const [sortBy, setSortBy] = useState<'title'|'author'|'category'|'isbn'|'shelf'>('title');
  const [sortOrder, setSortOrder] = useState<'asc'|'desc'>('asc');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterAvailability, setFilterAvailability] = useState<string>('all');
  const [useAISearch, setUseAISearch] = useState(false);
  const [aiSearchResults, setAISearchResults] = useState<SearchResult[]>([]);
  const [searchSuggestions, setSearchSuggestions] = useState<SearchSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [statsModal, setStatsModal] = useState<'total'|'available'|'categories'|'borrowed'|'reservations'|null>(null);
  const [borrowedRecords, setBorrowedRecords] = useState<BackendBorrowRecord[]>([]);
  const [reservationRecords, setReservationRecords] = useState<BackendReservationRecord[]>([]);
  const [reserveDialogOpen, setReserveDialogOpen] = useState(false);
  const [reserveTargetBook, setReserveTargetBook] = useState<BookRecord | null>(null);
  const [reserveQuantity, setReserveQuantity] = useState<number>(1);
  const [isSubmittingReserve, setIsSubmittingReserve] = useState(false);
  const [recentlyReserved, setRecentlyReserved] = useState<Record<string, boolean>>({});
  const setView = (m: any) => { setViewMode(m); };

  useEffect(() => {
    BooksService.ensureSeed();
    setBooks(BooksService.list());
  }, []);

  // Load borrowed books summary from backend (per-user for students, all for admins)
  const loadBorrowed = useCallback(async () => {
    try {
      if (!user?.id) {
        setBorrowedRecords([]);
        return;
      }
      let url: string;
      if (userType === 'admin') {
        url = `${API_BASE}/api/library/borrowed-all`;
      } else {
        url = `${API_BASE}/api/library/user-borrowed/${encodeURIComponent(user.id)}`;
      }
      const res = await fetch(url);
      if (!res.ok) {
        console.error('Failed to load borrowed books from backend');
        setBorrowedRecords([]);
        return;
      }
      const data = await res.json();
      const rows: any[] = Array.isArray(data.borrowed) ? data.borrowed : [];
      const today = new Date();
      const normalized: BackendBorrowRecord[] = rows.map((r) => {
        const borrowedAt = r.borrowed_at || r.borrowedAt;
        const dueDateStr = r.due_date || r.dueDate;
        const returnedAt = r.returned_at || r.returnedAt || null;
        const due = dueDateStr ? new Date(dueDateStr) : null;
        const isOverdue = !returnedAt && due && due < today;
        return {
          borrowId: r.borrow_id || r.borrowId || r.id,
          userId: r.user_id || r.userId,
          userType: r.user_type || r.userType || 'student',
          bookId: r.book_id || r.bookId,
          bookTitle: r.book_title || r.bookTitle || r.title,
          borrowedAt: borrowedAt,
          dueDate: dueDateStr,
          returnedAt,
          status: isOverdue ? 'overdue' : 'borrowed',
        };
      });
      setBorrowedRecords(normalized);
    } catch (err) {
      console.error('Error loading borrowed books from backend:', err);
      setBorrowedRecords([]);
    }
  }, [user?.id, userType]);

  // Initial load of borrowed data
  useEffect(() => {
    void loadBorrowed();
  }, [loadBorrowed]);

  // Load reservations summary from backend
  // - For STUDENT view: only this user's pending reservations
  // - For ADMIN view: all users' pending reservations
  const loadReservations = useCallback(async () => {
    try {
      if (!user?.id) {
        setReservationRecords([]);
        return;
      }

      let rows: any[] = [];

      if (userType === 'student') {
        // Student: query backend for this user's real DB reservations so that
        // mirror-side borrowing (which fulfills reservations) is reflected in
        // the stats cards and the "Book Reservations" dialog.
        const res = await fetch(`${API_BASE}/api/library/user-reservations/${encodeURIComponent(user.id)}`);
        if (res.ok) {
          const data = await res.json();
          rows = Array.isArray(data.reservations) ? data.reservations : [];
        } else {
          console.error('Failed to load user reservations from backend');
        }
      } else {
        // Admin: see all students' reservations
        const res = await fetch(`${API_BASE}/api/library/reservations-all`);
        if (res.ok) {
          const data = await res.json();
          rows = Array.isArray(data.reservations) ? data.reservations : [];
        } else {
          console.error('Failed to load reservations from backend');
        }
      }

      const normalized: BackendReservationRecord[] = rows.map((r) => ({
        reservationId: r.id || r.reservation_id,
        userId: r.user_id || r.userId,
        userType: r.user_type || r.userType || 'student',
        bookId: r.book_id || r.bookId,
        bookTitle: r.book_title || r.bookTitle || r.title,
        reservedAt: r.reserved_at || r.reservedAt,
        quantity: r.quantity ?? 1,
      }));

      setReservationRecords(normalized);
    } catch (err) {
      console.error('Error loading reservations:', err);
      setReservationRecords([]);
    }
  }, [user?.id, userType]);

  useEffect(() => {
    void loadReservations();
  }, [loadReservations]);

  // Periodically refresh reservations and borrowed stats so that
  // changes made from the mirror page (QR borrow/return) are reflected
  // without requiring a manual page refresh.
  useEffect(() => {
    const id = setInterval(() => {
      void loadReservations();
      void loadBorrowed();
    }, 10000); // every 10 seconds
    return () => clearInterval(id);
  }, [loadReservations, loadBorrowed]);

  // Hydrate preferences
  useEffect(() => {
    const uid = user?.id ?? 'guest';
    try {
      const { PreferenceService } = require("@/services/preferences");
      const p = PreferenceService.load(uid);
      if (p.booksView) setViewMode(p.booksView as any);
      if (p.booksSortBy) setSortBy(p.booksSortBy as any);
      if (p.booksSortOrder) setSortOrder(p.booksSortOrder as any);
      if (p.booksFilterCategory) setFilterCategory(p.booksFilterCategory);
      if (p.booksFilterAvailability) setFilterAvailability(p.booksFilterAvailability);
      if (typeof p.booksUseAISearch === 'boolean') setUseAISearch(p.booksUseAISearch);
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Persist preferences
  useEffect(() => {
    const uid = user?.id ?? 'guest';
    try {
      const { PreferenceService } = require("@/services/preferences");
      PreferenceService.save(uid, {
        booksView: viewMode,
        booksSortBy: sortBy,
        booksSortOrder: sortOrder,
        booksFilterCategory: filterCategory,
        booksFilterAvailability: filterAvailability,
        booksUseAISearch: useAISearch,
      });
    } catch {}
  }, [user?.id, viewMode, sortBy, sortOrder, filterCategory, filterAvailability, useAISearch]);

  // AI Search with debouncing
  const handleAISearch = useCallback(async (query: string) => {
    if (!query.trim() || !useAISearch) {
      setAISearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await aiSearchService.smartSearch(query, user?.id ?? 'guest');
      setAISearchResults(results);
    } catch (error) {
      console.error('AI search failed:', error);
      toast({ 
        title: 'AI Search Unavailable', 
        description: 'Using standard search instead.', 
        variant: 'default' 
      });
    } finally {
      setIsSearching(false);
    }
  }, [useAISearch, user?.id, toast]);

  // Auto-complete suggestions
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.length >= 2 && useAISearch) {
        const suggestions = await aiSearchService.getAutocompleteSuggestions(searchQuery);
        setSearchSuggestions(suggestions);
      } else {
        setSearchSuggestions([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, useAISearch]);

  // Trigger AI search when query changes
  useEffect(() => {
    if (useAISearch) {
      const timer = setTimeout(() => handleAISearch(searchQuery), 500);
      return () => clearTimeout(timer);
    }
  }, [searchQuery, useAISearch, handleAISearch]);

  const filtered = useMemo(() => {
    // Use AI search results if enabled and available
    if (useAISearch && aiSearchResults.length > 0) {
      let arr = aiSearchResults.map(r => r.book);
      
      // Apply filters
      const reservedIds = new Set(reservationRecords.map(r=>r.bookId));
      if (filterCategory !== 'all') arr = arr.filter(b => b.category.toLowerCase() === filterCategory);
      if (filterAvailability !== 'all') {
        if (filterAvailability === 'available') arr = arr.filter(b => b.status === 'available');
        if (filterAvailability === 'borrowed') arr = arr.filter(b => b.status !== 'available');
        if (filterAvailability === 'reserved') arr = arr.filter(b => reservedIds.has(b.id));
      }
      
      return arr; // Already sorted by AI relevance
    }
    
    // Standard search fallback
    const q = searchQuery.toLowerCase();
    const reservedIds = new Set(reservationRecords.map(r=>r.bookId));
    let arr = books.filter((b) => [b.id, b.title, b.author, b.category, b.isbn ?? ""].some((t) => t.toLowerCase().includes(q)));
    if (filterCategory !== 'all') arr = arr.filter(b => b.category.toLowerCase() === filterCategory);
    if (filterAvailability !== 'all') {
      if (filterAvailability === 'available') arr = arr.filter(b => b.status === 'available');
      if (filterAvailability === 'borrowed') arr = arr.filter(b => b.status !== 'available');
      if (filterAvailability === 'reserved') arr = arr.filter(b => reservedIds.has(b.id));
    }
    const cmp = (a: BookRecord, b: BookRecord) => {
      const get = (k: string) => (k==='shelf'? (a as any)[k] : (a as any)[k]);
      const getb = (k: string) => (k==='shelf'? (b as any)[k] : (b as any)[k]);
      const va = String(get(sortBy) ?? '');
      const vb = String(getb(sortBy) ?? '');
      const res = va.localeCompare(vb);
      return sortOrder==='asc'?res:-res;
    };
    return [...arr].sort(cmp);
  }, [books, searchQuery, sortBy, sortOrder, filterCategory, filterAvailability, useAISearch, aiSearchResults]);

  const reserve = (book: BookRecord) => {
    // Always allow reserving again; multiple reservations for same book will
    // simply add more rows/quantity to the reservations list.
    setReserveTargetBook(book);
    setReserveQuantity(1);
    setReserveDialogOpen(true);
  };

  const confirmReserve = async () => {
    if (!reserveTargetBook || reserveQuantity <= 0) {
      toast({ title: 'Invalid quantity', description: 'Please enter a quantity of at least 1.', variant: 'destructive' });
      return;
    }
    try {
      setIsSubmittingReserve(true);
      const book = reserveTargetBook;
      const studentId = user?.id ?? 'KC-XX-X-00000';
      const studentName = user?.fullName ?? 'Student';

      const res = await fetch(`${API_BASE}/api/library/reserve-book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: studentId,
          userType: userType,
          bookId: book.id,
          bookTitle: book.title,
          quantity: reserveQuantity,
        }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(text || 'Failed to create reservation in library system');
      }

      // Persist a localStorage reservation so the UI has a reliable source
      // for the Book Reservations card and survives refresh.
      ReservationsService.add(book.id, book.title, studentId, studentName, reserveQuantity);

      // Mark this book as recently reserved so the button text can flash
      // "Reserved" for a few seconds, then revert back to "Reserve" while
      // the reservation remains in the list.
      setRecentlyReserved(prev => ({ ...prev, [book.id]: true }));
      setTimeout(() => {
        setRecentlyReserved(prev => ({ ...prev, [book.id]: false }));
      }, 3000);

      // Re-sync reservations so counts and dialogs update.
      await loadReservations();

      // Notify all admins via centralized notification manager so it appears in their bell icon
      try {
        const { NotificationManager } = require("@/services/notificationManager");
        NotificationManager.bookReserved(studentId, studentName, book.id, book.title);
      } catch {
        NotificationsService.add({ receiverId: 'ADMIN', type: 'system', message: `Reservation: ${studentId} reserved ${book.title}` });
      }

      toast({ title: 'Reserved', description: `${book.title} reserved (${reserveQuantity} cop${reserveQuantity > 1 ? 'ies' : 'y'}). Please proceed to the library mirror scanner to borrow.` });
      setReserveDialogOpen(false);
      setReserveTargetBook(null);
    } catch (e: any) {
      toast({ title: 'Cannot reserve', description: e?.message ?? '', variant: 'destructive' });
    } finally {
      setIsSubmittingReserve(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar userType={userType} />
      
      <div className="flex">
        <Sidebar userType={userType} />
        
        <main className="flex-1 p-6">
          <div className="w-[95vw] md:w-[90vw] lg:w-[85vw] xl:w-[80vw] mx-auto space-y-6 overflow-y-auto">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-primary">Book Inventory</h1>
                <p className="text-muted-foreground mt-1">
                  Browse and manage the library collection
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Select value={viewMode} onValueChange={(v:any)=>setView(v)}>
                  <SelectTrigger className="w-36"><SelectValue placeholder="View"/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="list"><div className="flex items-center gap-2"><LayoutList className="h-4 w-4"/>List</div></SelectItem>
                    <SelectItem value="grid"><div className="flex items-center gap-2"><Grid3X3 className="h-4 w-4"/>Grid</div></SelectItem>
                    <SelectItem value="compact"><div className="flex items-center gap-2"><Rows3 className="h-4 w-4"/>Compact</div></SelectItem>
                    <SelectItem value="detailed"><div className="flex items-center gap-2"><FileText className="h-4 w-4"/>Detailed</div></SelectItem>
                  </SelectContent>
                </Select>
                {userType === "admin" && (
                  <Button className="w-full sm:w-auto" onClick={() => (window.location.href = '/book-management?new=1')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Book
                  </Button>
                )}
              </div>
            </div>

            {/* Search, Summary, Filters */}
            <Card className="shadow-jrmsu">
              <CardContent className="pt-6 space-y-4">
                {/* Summary clickable */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                  <Card className="hover:bg-muted cursor-pointer transition-colors" onClick={()=>setStatsModal('total')}><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Books</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-primary">{books.length}</div></CardContent></Card>
                  <Card className="hover:bg-muted cursor-pointer transition-colors" onClick={()=>setStatsModal('available')}><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Available</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-leaf">{books.filter(b=>b.status==='available').length}</div></CardContent></Card>
                  <Card className="hover:bg-muted cursor-pointer transition-colors" onClick={()=>setStatsModal('categories')}><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Categories</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-secondary">{Array.from(new Set(books.map(b=>b.category))).length}</div></CardContent></Card>
                  <Card className="hover:bg-muted cursor-pointer transition-colors" onClick={()=>setStatsModal('borrowed')}><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Borrowed</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-accent">{borrowedRecords.length}</div></CardContent></Card>
                  <Card className="hover:bg-muted cursor-pointer transition-colors" onClick={()=>setStatsModal('reservations')}><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Reservations</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{reservationRecords.length}</div></CardContent></Card>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
                  <div className="relative sm:col-span-2 lg:col-span-3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder={useAISearch ? "Ask Jose to help find books..." : "Search books by title, author, or category..."}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                    {isSearching && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      </div>
                    )}
                    {searchSuggestions.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg z-10 max-h-60 overflow-y-auto">
                        {searchSuggestions.map((sug) => (
                          <button
                            key={sug.id}
                            className="w-full px-4 py-2 text-left hover:bg-muted flex items-center justify-between"
                            onClick={() => {
                              setSearchQuery(sug.text);
                              setSearchSuggestions([]);
                            }}
                          >
                            <span className="text-sm">{sug.text}</span>
                            <Badge variant="outline" className="text-xs">
                              {sug.type}
                            </Badge>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <Button
                    className="w-full"
                    variant={useAISearch ? "default" : "outline"}
                    onClick={() => setUseAISearch(!useAISearch)}
                    title="Toggle AI-powered search"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    AI Search
                  </Button>
                  <Select value={sortBy} onValueChange={(v:any)=>setSortBy(v)}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Sort"/></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="title">Title</SelectItem>
                      <SelectItem value="author">Author</SelectItem>
                      <SelectItem value="category">Category</SelectItem>
                      <SelectItem value="isbn">ISBN</SelectItem>
                      <SelectItem value="shelf">Shelf</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button className="w-full" variant="outline" onClick={()=>setSortOrder(sortOrder==='asc'?'desc':'asc')}>{sortOrder==='asc'?'A→Z':'Z→A'}</Button>
                  <Select value={filterCategory} onValueChange={(v)=>setFilterCategory(v)}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Category"/></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      {Array.from(new Set(books.map(b=>b.category))).map(c=>(<SelectItem key={c} value={c.toLowerCase()}>{c}</SelectItem>))}
                    </SelectContent>
                  </Select>
                  <Select value={filterAvailability} onValueChange={(v)=>setFilterAvailability(v)}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Availability"/></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="borrowed">Borrowed/Unavailable</SelectItem>
                      <SelectItem value="reserved">Reserved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Book Inventory */}
            <Card id="inventory" className="shadow-jrmsu">
              <CardHeader>
                <CardTitle>Book Inventory</CardTitle>
              </CardHeader>
              <CardContent>
                {viewMode==='list' && (
                <div className="overflow-x-auto overflow-y-auto max-h-[60vh]">
                <Table className="min-w-[800px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Book ID</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Author</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Shelf</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((book) => (
                      <TableRow key={book.id}>
                        <TableCell className="font-medium">{book.id}</TableCell>
                        <TableCell>{book.title}</TableCell>
                        <TableCell>{book.author}</TableCell>
                        <TableCell>{book.category}</TableCell>
                        <TableCell>{book.shelf}</TableCell>
                        <TableCell>
                          <Badge variant={book.status === "available" ? "default" : "secondary"}>{book.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {(userType === "student" || userType === "admin") && (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={book.status !== "available"}
                              onClick={() => reserve(book)}
                            >
                              {recentlyReserved[book.id] ? 'Reserved' : 'Reserve'}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
                )}

                {viewMode==='compact' && (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead><tr className="border-b"><th className="p-2 text-left">Code</th><th className="p-2 text-left">Title</th><th className="p-2 text-left">Availability</th></tr></thead>
                      <tbody>
                        {filtered.map(b=> (
                          <tr key={b.id} className="border-b"><td className="p-2 font-mono text-xs">{b.id}</td><td className="p-2">{b.title}</td><td className="p-2"><Badge variant={b.status==='available'?'default':'secondary'}>{b.status}</Badge></td></tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {viewMode==='grid' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filtered.map(b => (
                      <Card key={b.id} className="shadow-jrmsu"><CardHeader><CardTitle className="text-lg">{b.title}</CardTitle></CardHeader><CardContent>
                        <div className="text-sm text-muted-foreground">{b.author}</div>
                        <div className="text-xs">{b.category}</div>
                        <div className="mt-2"><Badge variant={b.status==='available'?'default':'secondary'}>{b.status}</Badge></div>
                      </CardContent></Card>
                    ))}
                  </div>
                )}

                {viewMode==='detailed' && (
                  <div className="space-y-4">
                    {filtered.map(b => (
                      <Card key={b.id} className="shadow-jrmsu"><CardHeader><CardTitle className="text-lg">{b.title} <span className="font-normal text-muted-foreground">({b.id})</span></CardTitle></CardHeader><CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-1 text-sm">
                            <div><span className="text-muted-foreground">Author:</span> {b.author}</div>
                            <div><span className="text-muted-foreground">Category:</span> {b.category}</div>
                            <div><span className="text-muted-foreground">ISBN:</span> {b.isbn}</div>
                            <div><span className="text-muted-foreground">Shelf:</span> {b.shelf}</div>
                            <div><span className="text-muted-foreground">Status:</span> <Badge variant={b.status==='available'?'default':'secondary'}>{b.status}</Badge></div>
                          </div>
                          <div className="flex items-center justify-center">
                            <div className="h-32 w-32"><QRCodeDisplay data={JSON.stringify({t:'BOOK', id:b.id, title:b.title, author:b.author, category:b.category, isbn:b.isbn})} size={128} centerLabel="JRMSU–Library"/></div>
                          </div>
                          <div className="flex items-center justify-end gap-2">
                            {(userType === 'student' || userType === 'admin') && (
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={b.status!=='available'}
                                onClick={()=>reserve(b)}
                              >
                                {recentlyReserved[b.id] ? 'Reserved' : 'Reserve'}
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent></Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      {/* Statistics Overlay Modals */}
      <Dialog open={statsModal === 'total'} onOpenChange={(open) => !open && setStatsModal(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Total Books ({books.length})</DialogTitle>
            <DialogDescription>Complete list of all books in the library inventory</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {books.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">No data yet</p>
                <p className="text-sm text-muted-foreground mt-2">Books will appear here once added to the inventory</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Book ID</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {books.map((book) => (
                    <TableRow key={book.id}>
                      <TableCell className="font-mono text-xs">{book.id}</TableCell>
                      <TableCell className="font-medium">{book.title}</TableCell>
                      <TableCell>{book.author}</TableCell>
                      <TableCell><Badge variant={book.status === 'available' ? 'default' : 'secondary'}>{book.status}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={statsModal === 'available'} onOpenChange={(open) => !open && setStatsModal(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Available Books ({books.filter(b => b.status === 'available').length})</DialogTitle>
            <DialogDescription>Books currently available for borrowing</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {books.filter(b => b.status === 'available').length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">No data yet</p>
                <p className="text-sm text-muted-foreground mt-2">No books are currently available for borrowing</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Book ID</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>Category</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {books.filter(b => b.status === 'available').map((book) => (
                    <TableRow key={book.id}>
                      <TableCell className="font-mono text-xs">{book.id}</TableCell>
                      <TableCell className="font-medium">{book.title}</TableCell>
                      <TableCell>{book.author}</TableCell>
                      <TableCell>{book.category}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={statsModal === 'categories'} onOpenChange={(open) => !open && setStatsModal(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Book Categories ({Array.from(new Set(books.map(b => b.category))).length})</DialogTitle>
            <DialogDescription>Distribution of books across categories</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {Array.from(new Set(books.map(b => b.category))).length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">No data yet</p>
                <p className="text-sm text-muted-foreground mt-2">Categories will appear once books are added</p>
              </div>
            ) : (
              Array.from(new Set(books.map(b => b.category))).map((category) => {
                const count = books.filter(b => b.category === category).length;
                const percentage = Math.round((count / books.length) * 100);
                return (
                  <div key={category} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{category}</span>
                      <span className="text-sm text-muted-foreground">{count} books ({percentage}%)</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={statsModal === 'borrowed'} onOpenChange={(open) => !open && setStatsModal(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Borrowed Books ({borrowedRecords.length})</DialogTitle>
            <DialogDescription>Books currently borrowed by students</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {borrowedRecords.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">No data yet</p>
                <p className="text-sm text-muted-foreground mt-2">No books have been borrowed yet</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Book Title</TableHead>
                    <TableHead>{userType === 'admin' ? 'Student ID' : 'User ID'}</TableHead>
                    <TableHead>Borrow Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {borrowedRecords.map((record) => (
                    <TableRow key={record.borrowId}>
                      <TableCell className="font-medium">{record.bookTitle}</TableCell>
                      <TableCell className="font-mono text-xs">{record.userId}</TableCell>
                      <TableCell>{record.borrowedAt}</TableCell>
                      <TableCell>{record.dueDate}</TableCell>
                      <TableCell>
                        <Badge className={record.status === 'overdue' ? 'bg-destructive' : 'bg-primary'}>
                          {record.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={statsModal === 'reservations'} onOpenChange={(open) => !open && setStatsModal(null)}>
        <DialogContent className="max-w-3xl max-height-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Book Reservations ({reservationRecords.length})</DialogTitle>
            <DialogDescription>Books reserved by students</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
                    {reservationRecords.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">No data yet</p>
                <p className="text-sm text-muted-foreground mt-2">No reservations have been made yet</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                  <TableHead>Book Title</TableHead>
                  <TableHead>{userType === 'admin' ? 'Student' : 'User'}</TableHead>
                  <TableHead>Reserved Date</TableHead>
                  <TableHead>Copies</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reservationRecords.map((reservation) => (
                    <TableRow key={reservation.reservationId}>
                      <TableCell className="font-medium">{reservation.bookTitle}</TableCell>
                      <TableCell>{reservation.userId}</TableCell>
                      <TableCell>{reservation.reservedAt}</TableCell>
                      <TableCell>{reservation.quantity ?? 1}</TableCell>
                      <TableCell><Badge variant="outline">Reserved</Badge></TableCell>
                      <TableCell>
                        {(userType === 'student' && reservation.userId === (user?.id ?? '')) || userType === 'admin' ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={async () => {
                              try {
                                // Call backend to cancel the real reservation record
                                const res = await fetch(`${API_BASE}/api/library/cancel-reservation`, {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    userId: reservation.userId,
                                    bookId: reservation.bookId,
                                    // sessionId is optional; omit here so backend falls back to userId for naming
                                  }),
                                });

                                if (!res.ok) {
                                  const data = await res.json().catch(() => ({} as any));
                                  const msg = data?.error || 'Unable to cancel reservation.';
                                  throw new Error(msg);
                                }

                                // Remove from local state so the table updates immediately
                                setReservationRecords(prev => prev.filter(r => r.reservationId !== reservation.reservationId));

                                // Best-effort: also remove from legacy local ReservationsService store (if any)
                                try { ReservationsService.remove(reservation.reservationId); } catch {}

                                toast({
                                  title: 'Reservation cancelled',
                                  description: `${reservation.bookTitle} reservation has been cancelled.`,
                                });
                              } catch (err: any) {
                                toast({
                                  title: 'Cancel failed',
                                  description: err?.message || 'Unable to cancel reservation.',
                                  variant: 'destructive',
                                });
                              }
                            }}
                          >
                            Cancel
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Reserve quantity overlay */}
      <Dialog open={reserveDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setReserveDialogOpen(false);
          setReserveTargetBook(null);
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>How many copies would you like to reserve?</DialogTitle>
            <DialogDescription>
              {reserveTargetBook ? `${reserveTargetBook.title} by ${reserveTargetBook.author}` : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <label className="text-sm font-medium">
              Quantity
              <Input
                type="number"
                min={1}
                value={Number.isNaN(reserveQuantity) ? '' : reserveQuantity}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10);
                  setReserveQuantity(Number.isNaN(v) ? 1 : Math.max(1, v));
                }}
                className="mt-1 w-24"
              />
            </label>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setReserveDialogOpen(false);
                setReserveTargetBook(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmReserve}
              disabled={isSubmittingReserve}
            >
              {isSubmittingReserve ? 'Reserving...' : 'Confirm'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default Books;

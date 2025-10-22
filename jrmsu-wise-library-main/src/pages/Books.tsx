// merged react imports below
import { Search, Filter, Plus, LayoutList, Grid3X3, Rows3, FileText } from "lucide-react";
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
import { useEffect, useMemo, useState } from "react";
import { BooksService, type BookRecord } from "@/services/books";
import { BorrowService } from "@/services/borrow";
import { ReservationsService } from "@/services/reservations";
import { NotificationsService } from "@/services/notifications";
import { useToast } from "@/hooks/use-toast";
import QRCodeDisplay from "@/components/qr/QRCodeDisplay";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const Books = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const userType: "student" | "admin" = user?.role ?? "student";
  const [searchQuery, setSearchQuery] = useState("");
  const [books, setBooks] = useState<BookRecord[]>([]);
  const [viewMode, setViewMode] = useState<'list'|'grid'|'compact'|'detailed'>(() => (localStorage.getItem('books_view') as any) || 'list');
  const [sortBy, setSortBy] = useState<'title'|'author'|'category'|'isbn'|'shelf'>('title');
  const [sortOrder, setSortOrder] = useState<'asc'|'desc'>('asc');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterAvailability, setFilterAvailability] = useState<string>('all');
  const setView = (m: any) => { setViewMode(m); localStorage.setItem('books_view', m); };

  useEffect(() => {
    BooksService.ensureSeed();
    setBooks(BooksService.list());
  }, []);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    const reservedIds = new Set(ReservationsService.list().map(r=>r.bookId));
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
  }, [books, searchQuery, sortBy, sortOrder, filterCategory, filterAvailability]);

  const reserve = (book: BookRecord) => {
    try {
      const studentId = user?.id ?? 'KC-XX-X-00000';
      const studentName = user?.fullName ?? 'Student';
      ReservationsService.add(book.id, book.title, studentId, studentName);
      NotificationsService.add({ receiverId: 'ADMIN', type: 'system', message: `Reservation: ${studentId} reserved ${book.title}` });
      toast({ title: 'Reserved', description: `${book.title} reserved.` });
    } catch (e: any) {
      toast({ title: 'Cannot reserve', description: e?.message ?? '', variant: 'destructive' });
    }
  };

  const borrow = (bookId: string) => {
    try {
      const rec = BorrowService.borrow(bookId, user?.id ?? "KC-XX-X-00000");
      setBooks(BooksService.list());
      NotificationsService.add({ receiverId: user?.id ?? "", type: "borrow", message: `Borrowed ${rec.bookTitle}. Due ${rec.dueDate}` });
      toast({ title: "Borrowed", description: `Due on ${rec.dueDate}` });
    } catch (e: any) {
      toast({ title: "Cannot borrow", description: e?.message ?? "", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar userType={userType} />
      
      <div className="flex">
        <Sidebar userType={userType} />
        
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-primary">Book Inventory</h1>
                <p className="text-muted-foreground mt-1">
                  Browse and manage the library collection
                </p>
              </div>
              <div className="flex gap-2">
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
                  <Button>
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
                  <Card className="hover:bg-muted cursor-pointer" onClick={()=>document.getElementById('inventory')?.scrollIntoView({behavior:'smooth'})}><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Books</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-primary">{books.length}</div></CardContent></Card>
                  <Card className="hover:bg-muted cursor-pointer" onClick={()=>alert('Available list: '+books.filter(b=>b.status==='available').length)}><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Available</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-leaf">{books.filter(b=>b.status==='available').length}</div></CardContent></Card>
                  <Card className="hover:bg-muted cursor-pointer" onClick={()=>alert('Categories: '+Array.from(new Set(books.map(b=>b.category))).join(', '))}><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Categories</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-secondary">{Array.from(new Set(books.map(b=>b.category))).length}</div></CardContent></Card>
                  <Card className="hover:bg-muted cursor-pointer" onClick={()=>alert('Borrowed: '+BorrowService.list().length)}><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Borrowed</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-accent">{BorrowService.list().length}</div></CardContent></Card>
                  <Card className="hover:bg-muted cursor-pointer" onClick={()=>alert('Reservations: '+ReservationsService.list().length)}><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Reservations</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{ReservationsService.list().length}</div></CardContent></Card>
                </div>
                <div className="flex gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search books by title, author, or category..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={sortBy} onValueChange={(v:any)=>setSortBy(v)}>
                    <SelectTrigger className="w-36"><SelectValue placeholder="Sort"/></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="title">Title</SelectItem>
                      <SelectItem value="author">Author</SelectItem>
                      <SelectItem value="category">Category</SelectItem>
                      <SelectItem value="isbn">ISBN</SelectItem>
                      <SelectItem value="shelf">Shelf</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" onClick={()=>setSortOrder(sortOrder==='asc'?'desc':'asc')}>{sortOrder==='asc'?'A→Z':'Z→A'}</Button>
                  <Select value={filterCategory} onValueChange={(v)=>setFilterCategory(v)}>
                    <SelectTrigger className="w-40"><SelectValue placeholder="Category"/></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      {Array.from(new Set(books.map(b=>b.category))).map(c=>(<SelectItem key={c} value={c.toLowerCase()}>{c}</SelectItem>))}
                    </SelectContent>
                  </Select>
                  <Select value={filterAvailability} onValueChange={(v)=>setFilterAvailability(v)}>
                    <SelectTrigger className="w-40"><SelectValue placeholder="Availability"/></SelectTrigger>
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
                <Table>
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
                          {userType === "student" && (
                            <Button variant="outline" size="sm" disabled={book.status !== "available"} onClick={() => borrow(book.id)}>
                              Borrow
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
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
                            {userType==='student' && (
                              <Button variant="outline" size="sm" disabled={b.status!=='available'} onClick={()=>reserve(b)}>Reserve</Button>
                            )}
                            {userType==='student' && (
                              <Button variant="outline" size="sm" disabled={b.status!=='available'} onClick={()=>borrow(b.id)}>Borrow</Button>
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

    </div>
  );
};

export default Books;

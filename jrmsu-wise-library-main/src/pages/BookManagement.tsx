import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, BookPlus, Edit, Trash2, Download, QrCode, Plus, X } from "lucide-react";
import Navbar from "@/components/Layout/Navbar";
import Sidebar from "@/components/Layout/Sidebar";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useMemo, useState } from "react";
import { BooksService, type BookRecord, type CustomColumn, buildBookQrPayload } from "@/services/books";
import QRCodeDisplay, { downloadCanvasAsPng } from "@/components/qr/QRCodeDisplay";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const BookManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const userType: "student" | "admin" = user?.role ?? "student";
  const [searchTerm, setSearchTerm] = useState("");
  const [books, setBooks] = useState<BookRecord[]>([]);
  const [customColumns, setCustomColumns] = useState<CustomColumn[]>([]);
  const location = window.location;
  const params = new URLSearchParams(location.search);
  const [isCreateOpen, setIsCreateOpen] = useState(params.get('new') === '1');
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAddColumnOpen, setIsAddColumnOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<BookRecord | null>(null);
  const [draft, setDraft] = useState<BookRecord>({
    id: "",
    title: "",
    author: "",
    category: "",
    isbn: "",
    shelf: "",
    copies: 1,
    available: 1,
    status: "available",
  });
  const [newColumn, setNewColumn] = useState<CustomColumn>({
    key: "",
    label: "",
    type: "text"
  });

  useEffect(() => {
    BooksService.ensureSeed();
    loadData();
  }, []);
  
  const loadData = () => {
    setBooks(BooksService.list());
    setCustomColumns(BooksService.getCustomColumns());
  };

  const [sortBy, setSortBy] = useState<'title' | 'author' | 'category' | 'date'>('title');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterAvailability, setFilterAvailability] = useState<string>('all');
  const filtered = useMemo(() => {
    const q = searchTerm.toLowerCase();
    let arr = books.filter((b) =>
      [b.id, b.title, b.author, b.category, b.isbn ?? ""].some((v) => v.toLowerCase().includes(q))
    );
    if (filterCategory !== 'all') arr = arr.filter(b => b.category.toLowerCase() === filterCategory);
    if (filterAvailability !== 'all') arr = arr.filter(b => (filterAvailability === 'available' ? b.status === 'available' : b.status !== 'available'));
    // sort
    const cmp = (a: BookRecord, b: BookRecord) => {
      let va = '', vb = '';
      if (sortBy === 'title') { va = a.title; vb = b.title; }
      else if (sortBy === 'author') { va = a.author; vb = b.author; }
      else if (sortBy === 'category') { va = a.category; vb = b.category; }
      else { va = a.id; vb = b.id; }
      const res = va.localeCompare(vb);
      return sortOrder === 'asc' ? res : -res;
    };
    return [...arr].sort(cmp);
  }, [books, searchTerm, sortBy, sortOrder, filterCategory, filterAvailability]);

  const onCreate = () => {
    if (!draft.id || !draft.title || !draft.author || !draft.category) {
      toast({ title: "Validation Error", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    try {
      BooksService.create(draft);
      loadData();
      setIsCreateOpen(false);
      setDraft({ id: "", title: "", author: "", category: "", isbn: "", shelf: "", copies: 1, available: 1, status: "available" });
      toast({ title: "Success", description: "Book added successfully" });
    } catch (error) {
      toast({ title: "Error", description: String(error), variant: "destructive" });
    }
  };
  
  const onEdit = (book: BookRecord) => {
    setEditingBook(book);
    setDraft({ ...book });
    setIsEditOpen(true);
  };
  
  const onSaveEdit = () => {
    if (!draft.id || !draft.title || !draft.author || !draft.category) {
      toast({ title: "Validation Error", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    try {
      BooksService.update(draft.id, draft);
      loadData();
      setIsEditOpen(false);
      setEditingBook(null);
      toast({ title: "Success", description: "Book updated successfully" });
    } catch (error) {
      toast({ title: "Error", description: String(error), variant: "destructive" });
    }
  };

  const onDelete = (id: string) => {
    if (!confirm("Are you sure you want to delete this book?")) return;
    try {
      BooksService.remove(id);
      loadData();
      toast({ title: "Success", description: "Book deleted successfully" });
    } catch (error) {
      toast({ title: "Error", description: String(error), variant: "destructive" });
    }
  };
  
  const onAddColumn = () => {
    if (!newColumn.key || !newColumn.label) {
      toast({ title: "Validation Error", description: "Please enter column key and label", variant: "destructive" });
      return;
    }
    try {
      BooksService.addCustomColumn(newColumn);
      loadData();
      setIsAddColumnOpen(false);
      setNewColumn({ key: "", label: "", type: "text" });
      toast({ title: "Success", description: "Column added successfully" });
    } catch (error) {
      toast({ title: "Error", description: String(error), variant: "destructive" });
    }
  };
  
  const onRemoveColumn = (key: string) => {
    if (!confirm("Are you sure you want to remove this column? Data will be lost.")) return;
    try {
      BooksService.removeCustomColumn(key);
      loadData();
      toast({ title: "Success", description: "Column removed successfully" });
    } catch (error) {
      toast({ title: "Error", description: String(error), variant: "destructive" });
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
                <h1 className="text-3xl font-bold text-primary">Book Management</h1>
                <p className="text-muted-foreground mt-1">
                  Add, edit, and manage library inventory
                </p>
              </div>
              <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <BookPlus className="h-4 w-4" />
                    Add New Book
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Book</DialogTitle>
                  </DialogHeader>
                  <div className="max-h-[500px] overflow-y-auto space-y-4 px-1">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="code">Book Code *</Label>
                        <Input id="code" value={draft.id} onChange={(e) => setDraft({ ...draft, id: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="title">Title *</Label>
                        <Input id="title" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="author">Author *</Label>
                        <Input id="author" value={draft.author} onChange={(e) => setDraft({ ...draft, author: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="category">Category *</Label>
                        <Input id="category" value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="isbn">ISBN</Label>
                        <Input id="isbn" value={draft.isbn} onChange={(e) => setDraft({ ...draft, isbn: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="shelf">Shelf</Label>
                        <Input id="shelf" value={draft.shelf} onChange={(e) => setDraft({ ...draft, shelf: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="copies">Copies</Label>
                        <Input id="copies" type="number" min={1} value={draft.copies} onChange={(e) => setDraft({ ...draft, copies: Number(e.target.value) || 1, available: Number(e.target.value) || 1 })} />
                      </div>
                      {customColumns.map(col => (
                        <div key={col.key} className="space-y-2">
                          <Label htmlFor={`new-${col.key}`}>{col.label}</Label>
                          <Input 
                            id={`new-${col.key}`} 
                            type={col.type === 'number' ? 'number' : col.type === 'date' ? 'date' : 'text'}
                            value={draft[col.key] || ''} 
                            onChange={(e) => setDraft({ ...draft, [col.key]: e.target.value })} 
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                    <Button onClick={onCreate}>Save</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="shadow-jrmsu">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Books
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">{books.length}</div>
                </CardContent>
              </Card>

              <Card className="shadow-jrmsu">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Available
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-leaf">{books.filter(b=>b.status==='available').length}</div>
                </CardContent>
              </Card>

              <Card className="shadow-jrmsu">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Borrowed
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-accent">{books.filter(b=>b.status!=='available').length}</div>
                </CardContent>
              </Card>

              <Card className="shadow-jrmsu">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Categories
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-secondary">{Array.from(new Set(books.map(b=>b.category))).length}</div>
                </CardContent>
              </Card>
            </div>

            {/* Search and Filters */}
            <Card className="shadow-jrmsu">
              <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by title, author, ISBN..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    <Select value={sortBy} onValueChange={(v:any)=>setSortBy(v)}>
                      <SelectTrigger><SelectValue placeholder="Sort" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="title">Title</SelectItem>
                        <SelectItem value="author">Author</SelectItem>
                        <SelectItem value="category">Category</SelectItem>
                        <SelectItem value="date">Date Added</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" onClick={()=>setSortOrder(sortOrder==='asc'?'desc':'asc')}>{sortOrder==='asc'?'A→Z':'Z→A'}</Button>
                    <Select value={filterCategory} onValueChange={(v)=>setFilterCategory(v)}>
                      <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        {Array.from(new Set(books.map(b=>b.category))).map(c=>(<SelectItem key={c} value={c.toLowerCase()}>{c}</SelectItem>))}
                      </SelectContent>
                    </Select>
                    <Select value={filterAvailability} onValueChange={(v)=>setFilterAvailability(v)}>
                      <SelectTrigger><SelectValue placeholder="Availability" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="available">Available</SelectItem>
                        <SelectItem value="borrowed">Borrowed/Unavailable</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Books Table */}
            <Card className="shadow-jrmsu">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Book Inventory ({filtered.length} books)</CardTitle>
                <Dialog open={isAddColumnOpen} onOpenChange={setIsAddColumnOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Plus className="h-4 w-4" />
                      Add Column
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Custom Column</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="col-key">Column Key (no spaces)</Label>
                        <Input 
                          id="col-key" 
                          placeholder="e.g., publisher" 
                          value={newColumn.key} 
                          onChange={(e) => setNewColumn({ ...newColumn, key: e.target.value.toLowerCase().replace(/\s/g, '_') })} 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="col-label">Column Label</Label>
                        <Input 
                          id="col-label" 
                          placeholder="e.g., Publisher" 
                          value={newColumn.label} 
                          onChange={(e) => setNewColumn({ ...newColumn, label: e.target.value })} 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="col-type">Data Type</Label>
                        <Select value={newColumn.type} onValueChange={(v: any) => setNewColumn({ ...newColumn, type: v })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="text">Text</SelectItem>
                            <SelectItem value="number">Number</SelectItem>
                            <SelectItem value="date">Date</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsAddColumnOpen(false)}>Cancel</Button>
                      <Button onClick={onAddColumn}>Add Column</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-auto max-h-[600px] border rounded-lg">
                  <table className="w-full border-collapse">
                    <thead className="bg-muted/50 sticky top-0 z-10">
                      <tr className="border-b">
                        <th className="text-left p-3 font-medium whitespace-nowrap min-w-[120px]">Book Code</th>
                        <th className="text-left p-3 font-medium whitespace-nowrap min-w-[250px]">Title</th>
                        <th className="text-left p-3 font-medium whitespace-nowrap min-w-[180px]">Author</th>
                        <th className="text-left p-3 font-medium whitespace-nowrap min-w-[140px]">Category</th>
                        <th className="text-left p-3 font-medium whitespace-nowrap min-w-[140px]">ISBN</th>
                        <th className="text-left p-3 font-medium whitespace-nowrap min-w-[100px]">Shelf</th>
                        {customColumns.map(col => (
                          <th key={col.key} className="text-left p-3 font-medium whitespace-nowrap min-w-[150px]">
                            <div className="flex items-center gap-2">
                              {col.label}
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-5 w-5 p-0 hover:bg-destructive hover:text-white"
                                onClick={() => onRemoveColumn(col.key)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </th>
                        ))}
                        <th className="text-left p-3 font-medium whitespace-nowrap min-w-[100px]">Copies</th>
                        <th className="text-center p-3 font-medium whitespace-nowrap min-w-[100px]">QR</th>
                        <th className="text-center p-3 font-medium whitespace-nowrap min-w-[120px]">Status</th>
                        <th className="text-center p-3 font-medium whitespace-nowrap min-w-[200px]">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((book) => (
                        <tr key={book.id} className="border-b hover:bg-muted/30">
                          <td className="p-3 font-medium text-primary whitespace-nowrap">{book.id}</td>
                          <td className="p-3 font-medium">{book.title}</td>
                          <td className="p-3 text-muted-foreground">{book.author}</td>
                          <td className="p-3 whitespace-nowrap">
                            <Badge variant="outline">{book.category}</Badge>
                          </td>
                          <td className="p-3 text-sm whitespace-nowrap">{book.isbn}</td>
                          <td className="p-3 text-sm whitespace-nowrap">{book.shelf}</td>
                          {customColumns.map(col => (
                            <td key={col.key} className="p-3 text-sm whitespace-nowrap">
                              {book[col.key] || '-'}
                            </td>
                          ))}
                          <td className="p-3 whitespace-nowrap">
                            <div className="text-sm">
                              <span className="font-medium">{book.available}</span>
                              <span className="text-muted-foreground"> / {book.copies}</span>
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="flex justify-center">
                              <div className="h-16 w-16">
                                <QRCodeDisplay data={buildBookQrPayload(book)} size={64} centerLabel="JRMSU–Library" />
                              </div>
                            </div>
                          </td>
                          <td className="p-3 text-center whitespace-nowrap">
                            <Badge
                              className={
                                book.status === "available"
                                  ? "bg-leaf text-white"
                                  : "bg-destructive text-white"
                              }
                            >
                              {book.status.toUpperCase()}
                            </Badge>
                          </td>
                          <td className="p-3 text-center whitespace-nowrap">
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                title="Edit"
                                onClick={() => onEdit(book)}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                title="Download QR"
                                onClick={(event) => {
                                  const row = event.currentTarget.closest("tr");
                                  const canvas = row?.querySelector("canvas") as HTMLCanvasElement | null;
                                  if (canvas) {
                                    downloadCanvasAsPng(canvas, `${book.id}-qr.png`);
                                  }
                                }}
                              >
                                <Download className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                title="Delete"
                                onClick={() => onDelete(book.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {filtered.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    No books found. Try adjusting your search or filters.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      {/* Edit Book Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit Book: {editingBook?.id}</DialogTitle>
          </DialogHeader>
          <div className="max-h-[500px] overflow-y-auto space-y-4 px-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-code">Book Code *</Label>
                <Input id="edit-code" value={draft.id} disabled className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-title">Title *</Label>
                <Input id="edit-title" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-author">Author *</Label>
                <Input id="edit-author" value={draft.author} onChange={(e) => setDraft({ ...draft, author: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-category">Category *</Label>
                <Input id="edit-category" value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-isbn">ISBN</Label>
                <Input id="edit-isbn" value={draft.isbn} onChange={(e) => setDraft({ ...draft, isbn: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-shelf">Shelf</Label>
                <Input id="edit-shelf" value={draft.shelf} onChange={(e) => setDraft({ ...draft, shelf: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-copies">Total Copies</Label>
                <Input id="edit-copies" type="number" min={1} value={draft.copies} onChange={(e) => setDraft({ ...draft, copies: Number(e.target.value) || 1 })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-available">Available Copies</Label>
                <Input id="edit-available" type="number" min={0} value={draft.available} onChange={(e) => setDraft({ ...draft, available: Number(e.target.value) || 0 })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select value={draft.status} onValueChange={(v: any) => setDraft({ ...draft, status: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="borrowed">Borrowed</SelectItem>
                    <SelectItem value="unavailable">Unavailable</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {customColumns.map(col => (
                <div key={col.key} className="space-y-2">
                  <Label htmlFor={`edit-${col.key}`}>{col.label}</Label>
                  <Input 
                    id={`edit-${col.key}`} 
                    type={col.type === 'number' ? 'number' : col.type === 'date' ? 'date' : 'text'}
                    value={draft[col.key] || ''} 
                    onChange={(e) => setDraft({ ...draft, [col.key]: e.target.value })} 
                  />
                </div>
              ))}
            </div>
            
            {/* QR Code Preview */}
            <div className="space-y-2 pt-4 border-t">
              <Label>QR Code Preview</Label>
              <div className="flex justify-center p-4 bg-muted/30 rounded-lg">
                <QRCodeDisplay data={buildBookQrPayload(draft)} size={128} centerLabel="JRMSU–Library" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button onClick={onSaveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BookManagement;

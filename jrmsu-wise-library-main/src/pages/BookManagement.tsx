// merged react imports below
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, BookPlus, Edit, Trash2, BarChart } from "lucide-react";
import Navbar from "@/components/Layout/Navbar";
import Sidebar from "@/components/Layout/Sidebar";
import AIAssistant from "@/components/Layout/AIAssistant";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useMemo, useState } from "react";
import { BooksService, type BookRecord, buildBookQrPayload } from "@/services/books";
import QRCodeDisplay, { downloadCanvasAsPng } from "@/components/qr/QRCodeDisplay";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

const BookManagement = () => {
  const { user } = useAuth();
  const userType: "student" | "admin" = user?.role ?? "student";
  const [searchTerm, setSearchTerm] = useState("");
  const [books, setBooks] = useState<BookRecord[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
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

  useEffect(() => {
    BooksService.ensureSeed();
    setBooks(BooksService.list());
  }, []);

  const filtered = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return books.filter((b) =>
      [b.id, b.title, b.author, b.category, b.isbn ?? ""].some((v) => v.toLowerCase().includes(q))
    );
  }, [books, searchTerm]);

  const onCreate = () => {
    if (!draft.id || !draft.title || !draft.author || !draft.category) return;
    BooksService.create(draft);
    setBooks(BooksService.list());
    setIsCreateOpen(false);
    setDraft({ id: "", title: "", author: "", category: "", isbn: "", shelf: "", copies: 1, available: 1, status: "available" });
  };

  const onDelete = (id: string) => {
    BooksService.remove(id);
    setBooks(BooksService.list());
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="code">Book Code</Label>
                      <Input id="code" value={draft.id} onChange={(e) => setDraft({ ...draft, id: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="title">Title</Label>
                      <Input id="title" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="author">Author</Label>
                      <Input id="author" value={draft.author} onChange={(e) => setDraft({ ...draft, author: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
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
                  <div className="text-2xl font-bold text-primary">1,234</div>
                </CardContent>
              </Card>

              <Card className="shadow-jrmsu">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Available
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-leaf">856</div>
                </CardContent>
              </Card>

              <Card className="shadow-jrmsu">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Borrowed
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-accent">345</div>
                </CardContent>
              </Card>

              <Card className="shadow-jrmsu">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Categories
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-secondary">24</div>
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
                  
                  <Select defaultValue="all">
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="cs">Computer Science</SelectItem>
                      <SelectItem value="eng">Engineering</SelectItem>
                      <SelectItem value="bus">Business</SelectItem>
                      <SelectItem value="arts">Arts & Humanities</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Books Table */}
            <Card className="shadow-jrmsu">
              <CardHeader>
                <CardTitle>Book Inventory</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-medium">Book Code</th>
                        <th className="text-left p-3 font-medium">Title</th>
                        <th className="text-left p-3 font-medium">Author</th>
                        <th className="text-left p-3 font-medium">Category</th>
                        <th className="text-left p-3 font-medium">ISBN</th>
                        <th className="text-left p-3 font-medium">Copies</th>
                        <th className="text-left p-3 font-medium">QR</th>
                        <th className="text-left p-3 font-medium">Status</th>
                        <th className="text-left p-3 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((book) => (
                        <tr key={book.id} className="border-b hover:bg-muted/50">
                          <td className="p-3 font-medium text-primary">{book.id}</td>
                          <td className="p-3 font-medium">{book.title}</td>
                          <td className="p-3 text-muted-foreground">{book.author}</td>
                          <td className="p-3">
                            <Badge variant="outline">{book.category}</Badge>
                          </td>
                          <td className="p-3 text-sm">{book.isbn}</td>
                          <td className="p-3">
                            <div className="text-sm">
                              <span className="font-medium">{book.available}</span>
                              <span className="text-muted-foreground"> / {book.copies}</span>
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="h-16 w-16">
                              <QRCodeDisplay data={buildBookQrPayload(book)} size={64} centerLabel="JRMSU–Library" />
                            </div>
                          </td>
                          <td className="p-3">
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
                          <td className="p-3">
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm">
                                <BarChart className="h-3 w-3" />
                              </Button>
                              <Button variant="outline" size="sm">
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const row = (e: Element | null): HTMLCanvasElement | null => {
                                    if (!e) return null;
                                    return e.querySelector("canvas") as HTMLCanvasElement | null;
                                  };
                                  const cell = (event?.currentTarget as HTMLElement)?.closest("tr")?.querySelector(".h-16.w-16");
                                  const canvas = row(cell as Element);
                                  if (canvas) {
                                    downloadCanvasAsPng(canvas, `${book.id}-qr.png`);
                                  }
                                }}
                              >
                                Download
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-destructive hover:text-destructive"
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
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      <AIAssistant />
    </div>
  );
};

export default BookManagement;

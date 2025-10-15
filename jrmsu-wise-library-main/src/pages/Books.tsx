// merged react imports below
import { Search, Filter, Plus } from "lucide-react";
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
import AIAssistant from "@/components/Layout/AIAssistant";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useMemo, useState } from "react";
import { BooksService, type BookRecord } from "@/services/books";
import { BorrowService } from "@/services/borrow";
import { NotificationsService } from "@/services/notifications";
import { useToast } from "@/hooks/use-toast";

const Books = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const userType: "student" | "admin" = user?.role ?? "student";
  const [searchQuery, setSearchQuery] = useState("");
  const [books, setBooks] = useState<BookRecord[]>([]);

  useEffect(() => {
    BooksService.ensureSeed();
    setBooks(BooksService.list());
  }, []);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return books.filter((b) => [b.id, b.title, b.author, b.category, b.isbn ?? ""].some((t) => t.toLowerCase().includes(q)));
  }, [books, searchQuery]);

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
              {userType === "admin" && (
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Book
                </Button>
              )}
            </div>

            {/* Search and Filters */}
            <Card className="shadow-jrmsu">
              <CardContent className="pt-6">
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
                  <Button variant="outline">
                    <Filter className="h-4 w-4 mr-2" />
                    Filters
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Books Table */}
            <Card className="shadow-jrmsu">
              <CardHeader>
                <CardTitle>Available Books</CardTitle>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      <AIAssistant />
    </div>
  );
};

export default Books;

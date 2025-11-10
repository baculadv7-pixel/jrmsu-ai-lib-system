import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BookCheck, X } from "lucide-react";

interface BookReturnDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userName: string;
  borrowedBooks: any[];
  onYes: () => void;
  onNo: () => void;
}

export function BookReturnDialog({
  open,
  onOpenChange,
  userName,
  borrowedBooks,
  onYes,
  onNo
}: BookReturnDialogProps) {
  const bookCount = borrowedBooks.length;
  const bookText = bookCount === 1 ? 'book' : 'books';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            <BookCheck className="h-5 w-5" />
            Book Return
          </DialogTitle>
          <DialogDescription>
            Welcome back, {userName}!
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-4">
            <p className="text-sm font-medium text-foreground mb-2">
              You currently have {bookCount} borrowed {bookText}:
            </p>
            <ul className="space-y-1">
              {borrowedBooks.map((book, index) => (
                <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>{book.title || `Book ID: ${book.bookId}`}</span>
                </li>
              ))}
            </ul>
          </div>

          <p className="text-base font-semibold text-center mb-2">
            Do you want to return {bookCount === 1 ? 'this book' : 'these books'}?
          </p>
          <p className="text-sm text-muted-foreground text-center">
            If yes, we'll scan the QR code to process the return.
          </p>
        </div>

        <DialogFooter className="flex-row gap-2 sm:gap-2">
          <Button
            onClick={onNo}
            variant="outline"
            className="flex-1"
          >
            <X className="h-4 w-4 mr-2" />
            Not now
          </Button>
          <Button
            onClick={onYes}
            className="flex-1 bg-primary hover:bg-primary/90"
          >
            <BookCheck className="h-4 w-4 mr-2" />
            Yes, return now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

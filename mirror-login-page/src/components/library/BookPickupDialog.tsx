import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BookOpen, X } from "lucide-react";

interface BookPickupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userName: string;
  reservedBooks: any[];
  onYes: () => void;
  onNo: () => void;
}

export function BookPickupDialog({
  open,
  onOpenChange,
  userName,
  reservedBooks,
  onYes,
  onNo
}: BookPickupDialogProps) {
  const bookCount = reservedBooks.length;
  const bookText = bookCount === 1 ? 'book' : 'books';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            <BookOpen className="h-5 w-5" />
            Reserved Book Pickup
          </DialogTitle>
          <DialogDescription>
            Welcome, {userName}!
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="bg-accent/10 border border-accent/20 rounded-lg p-4 mb-4">
            <p className="text-sm font-medium text-foreground mb-2">
              You have {bookCount} reserved {bookText} ready for pickup:
            </p>
            <ul className="space-y-1">
              {reservedBooks.map((book, index) => (
                <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-accent">•</span>
                  <span>{book.title || `Book ID: ${book.bookId}`}</span>
                </li>
              ))}
            </ul>
          </div>

          <p className="text-base font-semibold text-center mb-2">
            Do you have the {bookText} with you?
          </p>
          <p className="text-sm text-muted-foreground text-center">
            If yes, we'll scan the QR code to confirm pickup.
          </p>
        </div>

        <DialogFooter className="flex-row gap-2 sm:gap-2">
          <Button
            onClick={onNo}
            variant="outline"
            className="flex-1"
          >
            <X className="h-4 w-4 mr-2" />
            No, I'll get it later
          </Button>
          <Button
            onClick={onYes}
            className="flex-1 bg-accent hover:bg-accent/90"
          >
            <BookOpen className="h-4 w-4 mr-2" />
            Yes, I have it
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

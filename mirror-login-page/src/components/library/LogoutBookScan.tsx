import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { QrCode, CheckCircle, BookOpen, AlertCircle } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
import { useLibrarySession } from "@/context/LibrarySessionContext";
import { useToast } from "@/hooks/use-toast";

interface LogoutBookScanProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  borrowedBooks: any[];
  onComplete: () => void;
}

export function LogoutBookScan({
  open,
  onOpenChange,
  borrowedBooks,
  onComplete
}: LogoutBookScanProps) {
  const { activateReturnTime } = useLibrarySession();
  const { toast } = useToast();
  const [scanning, setScanning] = useState(false);
  const [scannedBooks, setScannedBooks] = useState<string[]>([]);
  const [scanner, setScanner] = useState<Html5Qrcode | null>(null);
  const [currentScan, setCurrentScan] = useState<string | null>(null);

  const totalBooks = borrowedBooks.length;
  const scannedCount = scannedBooks.length;
  const allScanned = scannedCount === totalBooks;

  useEffect(() => {
    if (open && !scanner) {
      const html5QrCode = new Html5Qrcode("logout-qr-reader");
      setScanner(html5QrCode);
    }

    return () => {
      if (scanner) {
        scanner.stop().catch(() => {});
      }
    };
  }, [open]);

  useEffect(() => {
    if (allScanned && scannedCount > 0) {
      // All books scanned, auto-complete after a short delay
      setTimeout(() => {
        handleComplete();
      }, 1500);
    }
  }, [allScanned, scannedCount]);

  const startScanning = async () => {
    if (!scanner) return;

    try {
      setScanning(true);

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        async (decodedText) => {
          // Successfully scanned
          try {
            const qrData = JSON.parse(decodedText);
            const bookId = qrData.bookId || qrData.id || decodedText;

            // Check if already scanned
            if (scannedBooks.includes(bookId)) {
              toast({
                title: "Already Scanned",
                description: "This book has already been scanned.",
                variant: "default"
              });
              return;
            }

            // Check if this book is in borrowed list
            const isValidBook = borrowedBooks.some(b => 
              b.bookId === bookId || b.id === bookId
            );

            if (!isValidBook) {
              toast({
                title: "Invalid Book",
                description: "This book is not in your borrowed list.",
                variant: "destructive"
              });
              return;
            }

            // Activate return time for this book
            await activateReturnTime(bookId);

            // Add to scanned list
            setScannedBooks(prev => [...prev, bookId]);
            setCurrentScan(bookId);

            toast({
              title: "Book Scanned",
              description: `Return time activated for book ${bookId}`,
              variant: "default"
            });

            // Clear current scan indicator after 2 seconds
            setTimeout(() => setCurrentScan(null), 2000);

          } catch (err) {
            console.error("Error processing scanned book:", err);
            toast({
              title: "Scan Error",
              description: "Failed to process book scan. Please try again.",
              variant: "destructive"
            });
          }
        },
        (errorMessage) => {
          // Scanning error (usually just "no QR code found")
        }
      );
    } catch (err: any) {
      toast({
        title: "Camera Error",
        description: err.message || "Failed to start camera",
        variant: "destructive"
      });
      setScanning(false);
    }
  };

  const handleComplete = () => {
    if (scanner && scanning) {
      scanner.stop().catch(() => {});
    }
    setScanning(false);
    onComplete();
  };

  const handleClose = () => {
    if (scanner && scanning) {
      scanner.stop().catch(() => {});
    }
    setScanning(false);
    setScannedBooks([]);
    setCurrentScan(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            <BookOpen className="h-5 w-5" />
            Scan Borrowed Books Before Logout
          </DialogTitle>
          <DialogDescription>
            Please scan all your borrowed books to activate return time
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {/* Progress indicator */}
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Progress</span>
              <span className="text-sm font-bold text-primary">
                {scannedCount} / {totalBooks}
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${(scannedCount / totalBooks) * 100}%` }}
              />
            </div>
          </div>

          {/* Book list */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Books to scan:</p>
            <ul className="space-y-1">
              {borrowedBooks.map((book, index) => {
                const bookId = book.bookId || book.id;
                const isScanned = scannedBooks.includes(bookId);
                const isCurrentScan = currentScan === bookId;

                return (
                  <li 
                    key={index} 
                    className={`text-sm flex items-center gap-2 p-2 rounded ${
                      isScanned ? 'bg-accent/10 text-accent' : 'text-muted-foreground'
                    } ${isCurrentScan ? 'animate-pulse' : ''}`}
                  >
                    {isScanned ? (
                      <CheckCircle className="h-4 w-4 text-accent" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border-2 border-muted-foreground" />
                    )}
                    <span className={isScanned ? 'line-through' : ''}>
                      {book.title || `Book ID: ${bookId}`}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Scanner */}
          {!scanning && !allScanned && (
            <div className="text-center space-y-4">
              <div className="bg-muted/50 rounded-lg p-8 flex items-center justify-center">
                <QrCode className="h-24 w-24 text-muted-foreground" />
              </div>
            </div>
          )}

          {scanning && !allScanned && (
            <div className="space-y-4">
              <div id="logout-qr-reader" className="rounded-lg overflow-hidden border-2 border-primary"></div>
              <p className="text-sm text-center text-muted-foreground">
                Scan each book's QR code one by one
              </p>
            </div>
          )}

          {allScanned && (
            <div className="text-center space-y-4">
              <div className="bg-accent/10 rounded-lg p-8 flex items-center justify-center">
                <CheckCircle className="h-24 w-24 text-accent" />
              </div>
              <p className="text-base font-semibold text-accent">
                All books scanned! Logging out...
              </p>
            </div>
          )}

          {/* Warning message */}
          {!allScanned && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5" />
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  You must scan all borrowed books before you can logout from the library.
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-row gap-2 sm:gap-2">
          {!scanning && !allScanned && (
            <Button
              onClick={startScanning}
              className="flex-1 bg-primary hover:bg-primary/90"
            >
              <QrCode className="h-4 w-4 mr-2" />
              Start Scanning
            </Button>
          )}

          {scanning && !allScanned && (
            <Button
              onClick={handleClose}
              variant="outline"
              className="flex-1"
            >
              Cancel Logout
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

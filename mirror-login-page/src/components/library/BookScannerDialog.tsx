import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { QrCode, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";

interface BookScannerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'borrow' | 'return';
  onScanSuccess: (bookId: string) => void;
  onCancel?: () => void;
  showCancelReservation?: boolean;
}

export function BookScannerDialog({
  open,
  onOpenChange,
  mode,
  onScanSuccess,
  onCancel,
  showCancelReservation = false
}: BookScannerDialogProps) {
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanner, setScanner] = useState<Html5Qrcode | null>(null);

  const title = mode === 'borrow' ? 'Scan Book to Borrow' : 'Scan Book to Return';
  const description = mode === 'borrow' 
    ? 'Please scan the QR code on the book to confirm pickup'
    : 'Please scan the QR code on the book to process return';

  useEffect(() => {
    if (open && !scanner) {
      const html5QrCode = new Html5Qrcode("book-qr-reader");
      setScanner(html5QrCode);
    }

    return () => {
      if (scanner) {
        scanner.stop().catch(() => {});
      }
    };
  }, [open]);

  const startScanning = async () => {
    if (!scanner) return;

    try {
      setScanning(true);
      setError(null);

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        (decodedText) => {
          // Successfully scanned
          setScanned(true);
          setScanning(false);
          scanner.stop();
          
          // Extract book ID from QR code
          try {
            const qrData = JSON.parse(decodedText);
            const bookId = qrData.bookId || qrData.id || decodedText;
            onScanSuccess(bookId);
          } catch {
            // If not JSON, use as-is
            onScanSuccess(decodedText);
          }
        },
        (errorMessage) => {
          // Scanning error (usually just "no QR code found")
          // Don't show these as errors
        }
      );
    } catch (err: any) {
      setError(err.message || "Failed to start camera");
      setScanning(false);
    }
  };

  const handleClose = () => {
    if (scanner && scanning) {
      scanner.stop().catch(() => {});
    }
    setScanning(false);
    setScanned(false);
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            <QrCode className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {!scanning && !scanned && !error && (
            <div className="text-center space-y-4">
              <div className="bg-muted/50 rounded-lg p-8 flex items-center justify-center">
                <QrCode className="h-24 w-24 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                Click the button below to start scanning
              </p>
            </div>
          )}

          {scanning && (
            <div className="space-y-4">
              <div id="book-qr-reader" className="rounded-lg overflow-hidden border-2 border-primary"></div>
              <p className="text-sm text-center text-muted-foreground">
                Position the QR code within the frame
              </p>
            </div>
          )}

          {scanned && (
            <div className="text-center space-y-4">
              <div className="bg-accent/10 rounded-lg p-8 flex items-center justify-center">
                <CheckCircle className="h-24 w-24 text-accent" />
              </div>
              <p className="text-base font-semibold text-accent">
                Book scanned successfully!
              </p>
            </div>
          )}

          {error && (
            <div className="text-center space-y-4">
              <div className="bg-destructive/10 rounded-lg p-8 flex items-center justify-center">
                <XCircle className="h-24 w-24 text-destructive" />
              </div>
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {showCancelReservation && scanning && (
            <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                    Changed your mind?
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                    You can cancel this reservation and logout instead.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-row gap-2 sm:gap-2">
          {showCancelReservation && scanning && onCancel && (
            <Button
              onClick={onCancel}
              variant="destructive"
              className="flex-1"
            >
              Cancel Reservation & Logout
            </Button>
          )}
          
          {!scanning && !scanned && (
            <Button
              onClick={startScanning}
              className="flex-1 bg-primary hover:bg-primary/90"
            >
              <QrCode className="h-4 w-4 mr-2" />
              Start Scanning
            </Button>
          )}

          {(scanning || error) && (
            <Button
              onClick={handleClose}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
          )}

          {scanned && (
            <Button
              onClick={handleClose}
              className="flex-1"
            >
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

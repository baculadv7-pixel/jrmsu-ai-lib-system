import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { QrCode, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { QRScanner } from "@/components/qr/QRScanner";

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

  const title = 'Camera Scanner For BOOKs';
  const description = mode === 'borrow'
    ? '🎥 Camera is active for scan reserved books! Please position the QR code of your reserved book inside the frame.'
    : '🎥 Camera is active for scan return books! Please position the QR code of your borrowed book inside the frame.';

  // First-stage overlay text when a QR code is successfully detected
  // This is shown immediately after the camera reads a valid book QR
  const successHeadline = 'QRCODE BOOK SUCCESSFULL SCAN';

  const startScanning = () => {
    setScanning(true);
    setError(null);
  };

  const handleClose = () => {
    setScanning(false);
    setScanned(false);
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="w-[96vw] sm:w-auto sm:max-w-xl md:max-w-2xl lg:max-w-3xl max-h-[90vh] flex flex-col"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            <QrCode className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 flex-1 flex flex-col gap-4">
          {!scanning && !scanned && !error && (
            <div className="text-center space-y-4">
              <div className="bg-muted/50 rounded-lg p-8 flex items-center justify-center">
                <QrCode className="h-24 w-24 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                Click the button below to start the book scanner.
              </p>
            </div>
          )}

          {scanning && (
            <div className="space-y-4">
              <div className="w-full max-w-[640px] mx-auto rounded-xl border-2 border-primary/80 bg-black/80 p-2 aspect-[4/3] flex items-center justify-center">
                {/* Reuse the same advanced QR scanner used for login/logout */}
                <QRScanner
                  containerId="book-qr-scanner-container"
                  onScanSuccess={(decodedText) => {
                    try {
                      const qrData = JSON.parse(decodedText);
                      const bookId = qrData.bookId || qrData.id || decodedText;
                      setScanned(true);
                      setScanning(false);
                      onScanSuccess(bookId);
                    } catch {
                      setScanned(true);
                      setScanning(false);
                      onScanSuccess(decodedText);
                    }
                  }}
                  onError={(err) => {
                    // Only surface meaningful errors; ignore transient "no QR code" messages
                    if (!err) return;
                    setError(err);
                  }}
                />
              </div>
              <p className="text-sm text-center text-muted-foreground">
                Position the QR code of your {mode === 'borrow' ? 'reserved' : 'borrowed'} book within the frame.
              </p>

              {/* Inline reservation cancel hint + button during borrow-mode scanning */}
              {showCancelReservation && (
                <div className="mt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex-1 flex items-start gap-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
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
                  {onCancel && (
                    <div className="sm:ml-3 flex-shrink-0 flex justify-end">
                      <Button
                        onClick={onCancel}
                        variant="destructive"
                        className="w-full sm:w-auto"
                      >
                        Cancel Reservation & Logout
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {scanned && (
            <div className="text-center space-y-4">
              <div className="bg-accent/10 rounded-lg p-8 flex items-center justify-center">
                <CheckCircle className="h-24 w-24 text-accent" />
              </div>
              <p className="text-base font-semibold text-accent">
                {successHeadline}
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

        </div>

        <DialogFooter className="flex-row gap-2 sm:gap-2">
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

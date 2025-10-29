import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { XCircle } from "lucide-react";
import { useLibrarySession } from "@/context/LibrarySessionContext";
import { useToast } from "@/hooks/use-toast";

interface CancelReservationButtonProps {
  bookId: string;
  bookTitle?: string;
  onCancelled: () => void;
}

export function CancelReservationButton({
  bookId,
  bookTitle,
  onCancelled
}: CancelReservationButtonProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const { cancelReservation, endSession } = useLibrarySession();
  const { toast } = useToast();

  const handleCancel = async () => {
    try {
      setCancelling(true);

      // Cancel the reservation
      await cancelReservation(bookId);

      toast({
        title: "Reservation Cancelled",
        description: "Your book reservation has been cancelled. Logging out...",
        variant: "default"
      });

      // End library session (logout)
      await endSession();

      // Notify parent component
      onCancelled();

      setShowDialog(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel reservation",
        variant: "destructive"
      });
    } finally {
      setCancelling(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setShowDialog(true)}
        variant="destructive"
        className="w-full"
      >
        <XCircle className="h-4 w-4 mr-2" />
        Cancel Borrow Book and Logout
      </Button>

      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-destructive" />
              Cancel Reservation?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Are you sure you want to cancel your reservation for:
              </p>
              <p className="font-semibold text-foreground">
                {bookTitle || `Book ID: ${bookId}`}
              </p>
              <p className="text-amber-600 dark:text-amber-400">
                This action will:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Cancel your book reservation</li>
                <li>Notify all library admins</li>
                <li>Log you out from the library system</li>
              </ul>
              <p className="text-sm text-muted-foreground mt-2">
                You can reserve this book again later from the main portal.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelling}>
              Keep Reservation
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              disabled={cancelling}
              className="bg-destructive hover:bg-destructive/90"
            >
              {cancelling ? "Cancelling..." : "Yes, Cancel & Logout"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

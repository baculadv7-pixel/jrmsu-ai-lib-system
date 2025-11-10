import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, CheckCircle, XCircle, User, Mail, IdCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export interface ActionRequiredNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  action_required: boolean;
  action_payload?: {
    actions: string[];
  };
  meta?: {
    requestId?: string;
    requesterId?: string;
    email?: string;
    fullName?: string;
  };
  actor_id?: string;
  timestamp?: Date;
  created_at?: number;
}

interface AdminActionOverlayProps {
  notification: ActionRequiredNotification | null;
  open: boolean;
  onClose: () => void;
  onAction: (action: string) => void;
  adminId: string;
}

export function AdminActionOverlay({ 
  notification, 
  open, 
  onClose, 
  onAction,
  adminId 
}: AdminActionOverlayProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedAction, setSelectedAction] = useState<string | null>(null);

  if (!notification) return null;

  const handleAction = async (action: string) => {
    setSelectedAction(action);
    setLoading(true);
    
    try {
      const requestId = notification.meta?.requestId;
      if (!requestId) {
        throw new Error("No request ID found");
      }

      // Call backend API
      const response = await fetch('http://localhost:5000/api/auth/admin-respond', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestId: requestId,
          action: action,
          adminId: adminId
        }),
        credentials: 'include'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process request');
      }

      toast({
        title: action === 'grant' ? "Request Approved" : "Request Declined",
        description: `Password reset request has been ${action === 'grant' ? 'approved' : 'declined'}. User has been notified.`,
        variant: action === 'grant' ? "default" : "destructive"
      });

      onAction(action);
      onClose();
      
    } catch (error: any) {
      console.error('Failed to process admin action:', error);
      toast({
        title: "Action Failed",
        description: error.message || "Failed to process the request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setSelectedAction(null);
    }
  };

  const actions = notification.action_payload?.actions || [];
  const requesterId = notification.meta?.requesterId || notification.actor_id || 'Unknown';
  const requesterEmail = notification.meta?.email || 'N/A';
  const requesterName = notification.meta?.fullName || 'Unknown User';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-600" />
            Password Reset Request
          </DialogTitle>
          <DialogDescription>
            Review and respond to the password reset request below
          </DialogDescription>
        </DialogHeader>

        <Card className="border-orange-200 bg-orange-50/30">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-start gap-3">
              <IdCard className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">User ID</p>
                <p className="text-sm font-semibold">{requesterId}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Full Name</p>
                <p className="text-sm font-semibold">{requesterName}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Email Address</p>
                <p className="text-sm font-semibold">{requesterEmail}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="bg-muted/50 p-3 rounded-md">
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> Granting this request will allow the user to reset their password immediately. 
            Declining will notify the user that their request was denied.
          </p>
        </div>

        <DialogFooter className="flex gap-2 sm:gap-2">
          {actions.includes('decline') && (
            <Button
              variant="destructive"
              className="flex-1"
              onClick={() => handleAction('decline')}
              disabled={loading}
            >
              {loading && selectedAction === 'decline' ? (
                <>
                  <XCircle className="h-4 w-4 mr-2 animate-spin" />
                  Declining...
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  Decline
                </>
              )}
            </Button>
          )}
          
          {actions.includes('grant') && (
            <Button
              variant="default"
              className="flex-1 bg-green-600 hover:bg-green-700"
              onClick={() => handleAction('grant')}
              disabled={loading}
            >
              {loading && selectedAction === 'grant' ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2 animate-spin" />
                  Granting...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Grant
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

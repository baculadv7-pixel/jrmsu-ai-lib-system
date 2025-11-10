/**
 * Password Reset Request Overlay
 * Shows when admin clicks a password reset notification
 * Displays user details and Grant/Decline buttons
 */

import { useState } from 'react';
import { X, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';

interface PasswordResetOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  requestData: {
    requesterId: string;
    requesterName: string;
    requesterEmail: string;
    requestTime: string;
    notificationId: string;
  };
}

export function PasswordResetOverlay({ isOpen, onClose, requestData }: PasswordResetOverlayProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleGrant = async () => {
    setIsProcessing(true);
    
    try {
      // Call backend API to grant password reset
      const response = await fetch('http://localhost:5000/api/auth/admin-respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requesterId: requestData.requesterId,
          action: 'grant',
          notificationId: requestData.notificationId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to grant password reset');
      }

      const result = await response.json();

      toast({
        title: "✅ Password Reset Granted",
        description: `Reset request for ${requestData.requesterName} (${requestData.requesterId}) has been approved.`,
        duration: 4000
      });

      // Close overlay
      onClose();

      // Reload notifications
      window.location.reload();

    } catch (error: any) {
      console.error('Failed to grant password reset:', error);
      toast({
        title: "Error",
        description: "Failed to grant password reset. Please try again.",
        variant: "destructive",
        duration: 4000
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDecline = async () => {
    setIsProcessing(true);
    
    try {
      // Call backend API to decline password reset
      const response = await fetch('http://localhost:5000/api/auth/admin-respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requesterId: requestData.requesterId,
          action: 'decline',
          notificationId: requestData.notificationId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to decline password reset');
      }

      const result = await response.json();

      toast({
        title: "❌ Password Reset Declined",
        description: `Reset request for ${requestData.requesterName} (${requestData.requesterId}) has been declined.`,
        duration: 4000
      });

      // Close overlay
      onClose();

      // Reload notifications
      window.location.reload();

    } catch (error: any) {
      console.error('Failed to decline password reset:', error);
      toast({
        title: "Error",
        description: "Failed to decline password reset. Please try again.",
        variant: "destructive",
        duration: 4000
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-md mx-4 shadow-2xl">
        <CardHeader className="relative">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
            disabled={isProcessing}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
          <CardTitle className="text-xl font-bold">Password Reset Request</CardTitle>
          <CardDescription>Review the details and approve or decline the request</CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* User Details */}
          <div className="space-y-3 rounded-lg bg-muted p-4">
            <div className="flex justify-between">
              <span className="font-medium text-muted-foreground">User ID:</span>
              <span className="font-semibold">{requestData.requesterId}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="font-medium text-muted-foreground">Full Name:</span>
              <span className="font-semibold">{requestData.requesterName}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="font-medium text-muted-foreground">Email:</span>
              <span className="font-semibold text-sm">{requestData.requesterEmail}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="font-medium text-muted-foreground">Request Time:</span>
              <span className="font-semibold text-sm">{requestData.requestTime}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              onClick={handleGrant}
              disabled={isProcessing}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Grant
                </>
              )}
            </Button>
            
            <Button
              onClick={handleDecline}
              disabled={isProcessing}
              variant="destructive"
              className="flex-1"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <XCircle className="mr-2 h-4 w-4" />
                  Decline
                </>
              )}
            </Button>
          </div>

          {/* Info Message */}
          <p className="text-xs text-muted-foreground text-center pt-2">
            This action will notify the user and all administrators.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

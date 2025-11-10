import { useState } from "react";
import { Bell, Check, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Notification } from "@/types/auth";
import { AdminActionOverlay, ActionRequiredNotification } from "@/components/notifications/AdminActionOverlay";
import { useAuth } from "@/context/AuthContext";

interface NotificationBellProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDismiss: (id: string) => void;
}

export function NotificationBell({ 
  notifications, 
  onMarkAsRead, 
  onMarkAllAsRead, 
  onDismiss 
}: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const [actionOverlayOpen, setActionOverlayOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<ActionRequiredNotification | null>(null);
  const { user } = useAuth();
  
  const unreadCount = notifications.filter(n => !n.read).length;
  
  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'error': return 'text-destructive';
      case 'warning': return 'text-orange-600';
      case 'success': return 'text-green-600';
      default: return 'text-primary';
    }
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'error': return '⚠️';
      case 'warning': return '⚠️';
      case 'success': return '✅';
      default: return 'ℹ️';
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const handleNotificationClick = (notification: any) => {
    // Check if notification requires admin action
    if ((notification as any).action_required && (notification as any).action_payload?.actions) {
      // This is an action-required notification, open the overlay
      setSelectedNotification(notification as ActionRequiredNotification);
      setActionOverlayOpen(true);
      setOpen(false);
    } else {
      // Regular notification, just mark as read
      if (!notification.read) {
        onMarkAsRead(notification.id);
      }
    }
  };

  const handleActionComplete = (action: string) => {
    // Refresh notifications or handle action completion
    console.log('Admin action completed:', action);
    // You might want to call a callback here to refresh notifications
  };

  return (
    <>
      <AdminActionOverlay
        notification={selectedNotification}
        open={actionOverlayOpen}
        onClose={() => {
          setActionOverlayOpen(false);
          setSelectedNotification(null);
        }}
        onAction={handleActionComplete}
        adminId={user?.id || 'ADMIN'}
      />
    
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs flex items-center justify-center"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-auto p-1 text-xs"
              onClick={onMarkAllAsRead}
            >
              Mark all read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No notifications</p>
          </div>
        ) : (
          <ScrollArea className="h-80">
            {notifications.map((notification) => (
              <DropdownMenuItem 
                key={notification.id} 
                className="p-0 cursor-pointer"
                onClick={() => handleNotificationClick(notification)}
              >
                <Card className={`w-full border-0 shadow-none ${!notification.read ? 'bg-muted/50' : ''} ${(notification as any).action_required ? 'border-l-4 border-l-orange-500' : ''}`}>
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {(notification as any).action_required && (
                            <AlertCircle className="h-4 w-4 text-orange-600 flex-shrink-0" />
                          )}
                          <span>{getNotificationIcon(notification.type)}</span>
                          <h4 className={`text-sm font-medium truncate ${getNotificationColor(notification.type)}`}>
                            {notification.title}
                          </h4>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatTime(notification.timestamp)}
                        </p>
                        {(notification as any).action_required && (
                          <Badge variant="outline" className="mt-2 text-xs bg-orange-50 text-orange-700 border-orange-300">
                            Action Required
                          </Badge>
                        )}
                      </div>
                      <div className="flex gap-1">
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              onMarkAsRead(notification.id);
                            }}
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDismiss(notification.id);
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </DropdownMenuItem>
            ))}
          </ScrollArea>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
    </>
  );
}
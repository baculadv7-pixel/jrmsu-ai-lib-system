import { useState, useMemo } from "react";
import { Bell, Check, X, MoreVertical, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

// Database-like notification structure
export interface LibraryNotification {
  NotificationID: string;
  UserID: string;
  Title: string;
  Message: string;
  Status: "Read" | "Unread";
  CreatedAt: Date;
  Type: "system" | "book" | "user" | "security" | "reminder";
  LinkedAction?: string; // URL or action to perform when clicked
}

interface NotificationPanelProps {
  notifications: LibraryNotification[];
  onNotificationClick: (notification: LibraryNotification) => void;
  onMarkAsRead: (notificationId: string) => void;
  onMarkAllAsRead: () => void;
  onDismiss: (notificationId: string) => void;
}

export function NotificationPanel({
  notifications,
  onNotificationClick,
  onMarkAsRead,
  onMarkAllAsRead,
  onDismiss
}: NotificationPanelProps) {
  const [open, setOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<LibraryNotification | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const { toast } = useToast();

  const unreadNotifications = useMemo(() => 
    notifications.filter(n => n.Status === "Unread"), 
    [notifications]
  );

  const unreadCount = unreadNotifications.length;

  const getNotificationIcon = (type: LibraryNotification['Type']) => {
    switch (type) {
      case 'system': return '⚙️';
      case 'book': return '📚';
      case 'user': return '👤';
      case 'security': return '🔒';
      case 'reminder': return '⏰';
      default: return 'ℹ️';
    }
  };

  const getStatusColor = (status: LibraryNotification['Status']) => {
    return status === "Unread" ? "bg-yellow-400" : "bg-gray-300";
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return 'Yesterday';
    return `${days}d ago`;
  };

  const handleNotificationClick = (notification: LibraryNotification) => {
    // Auto-mark as read when clicked
    if (notification.Status === "Unread") {
      onMarkAsRead(notification.NotificationID);
    }
    
    // Show detail dialog
    setSelectedNotification(notification);
    setShowDetailDialog(true);
    setOpen(false);
    
    // Also call the original handler
    onNotificationClick(notification);
  };

  const handleMarkAllRead = () => {
    onMarkAllAsRead();
    toast({
      title: "Notifications updated",
      description: "All notifications marked as read"
    });
  };

  const handleDismiss = (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    onDismiss(notificationId);
    toast({
      title: "Notification dismissed",
      description: "Notification removed from your list"
    });
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-navy-foreground hover:bg-navy-foreground/10">
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
      <DropdownMenuContent align="end" className="w-96 p-0">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">Notifications</h3>
            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleMarkAllRead}
                className="text-primary hover:text-primary/80"
              >
                Mark All as Read
              </Button>
            )}
          </div>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mx-4 mt-2">
            <TabsTrigger value="all">All Notifications</TabsTrigger>
            <TabsTrigger value="unread">
              Unread {unreadCount > 0 && `(${unreadCount})`}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="mt-0">
            <ScrollArea className="h-80">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No notifications</p>
                </div>
              ) : (
                <div className="space-y-1 p-2">
                  {notifications.map((notification) => (
                    <Card 
                      key={notification.NotificationID}
                      className={`cursor-pointer transition-colors hover:bg-muted/50 border-0 shadow-none ${
                        notification.Status === "Unread" ? 'bg-blue-50/50' : ''
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <span className="text-lg mt-0.5 flex-shrink-0">
                              {getNotificationIcon(notification.Type)}
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="text-sm font-medium truncate">
                                  {notification.Title}
                                </h4>
                                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${getStatusColor(notification.Status)}`} />
                              </div>
                              <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                                {notification.Message}
                              </p>
                              <div className="flex items-center justify-between">
                                <p className="text-xs text-muted-foreground">
                                  {formatTimestamp(notification.CreatedAt)}
                                </p>
                                <Badge variant="outline" className="text-xs">
                                  {notification.Type}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 flex-shrink-0"
                            onClick={(e) => handleDismiss(e, notification.NotificationID)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="unread" className="mt-0">
            <ScrollArea className="h-80">
              {unreadNotifications.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground">
                  <Check className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No unread notifications</p>
                  <p className="text-xs">You're all caught up!</p>
                </div>
              ) : (
                <div className="space-y-1 p-2">
                  {unreadNotifications.map((notification) => (
                    <Card 
                      key={notification.NotificationID}
                      className="cursor-pointer transition-colors hover:bg-muted/50 border-0 shadow-none bg-blue-50/50"
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <span className="text-lg mt-0.5 flex-shrink-0">
                              {getNotificationIcon(notification.Type)}
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="text-sm font-medium truncate">
                                  {notification.Title}
                                </h4>
                                <div className="w-2 h-2 rounded-full flex-shrink-0 bg-yellow-400" />
                              </div>
                              <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                                {notification.Message}
                              </p>
                              <div className="flex items-center justify-between">
                                <p className="text-xs text-muted-foreground">
                                  {formatTimestamp(notification.CreatedAt)}
                                </p>
                                <Badge variant="outline" className="text-xs">
                                  {notification.Type}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 flex-shrink-0"
                            onClick={(e) => handleDismiss(e, notification.NotificationID)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DropdownMenuContent>
    </DropdownMenu>

    {/* Notification Detail Dialog */}
    <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <span className="text-2xl">
              {selectedNotification && getNotificationIcon(selectedNotification.Type)}
            </span>
            <div className="flex-1">
              <DialogTitle className="text-xl">
                {selectedNotification?.Title}
              </DialogTitle>
              <DialogDescription className="flex items-center gap-2 mt-1">
                <Badge variant="outline">{selectedNotification?.Type}</Badge>
                <span className="text-xs">
                  {selectedNotification && formatTimestamp(selectedNotification.CreatedAt)}
                </span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Full Message */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {selectedNotification?.Message}
            </p>
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground mb-1">Status</p>
              <Badge variant={selectedNotification?.Status === 'Unread' ? 'default' : 'secondary'}>
                {selectedNotification?.Status}
              </Badge>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Notification ID</p>
              <p className="font-mono text-xs">{selectedNotification?.NotificationID}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Created</p>
              <p className="text-xs">
                {selectedNotification?.CreatedAt.toLocaleString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Type</p>
              <p className="capitalize">{selectedNotification?.Type}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-4 border-t">
            {selectedNotification?.Status === 'Unread' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (selectedNotification) {
                    onMarkAsRead(selectedNotification.NotificationID);
                    setSelectedNotification({
                      ...selectedNotification,
                      Status: 'Read'
                    });
                    toast({
                      title: "Marked as read",
                      description: "Notification has been marked as read"
                    });
                  }
                }}
              >
                <Check className="h-4 w-4 mr-2" />
                Mark as Read
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (selectedNotification) {
                  onDismiss(selectedNotification.NotificationID);
                  setShowDetailDialog(false);
                  toast({
                    title: "Notification dismissed",
                    description: "Notification has been removed"
                  });
                }
              }}
            >
              <X className="h-4 w-4 mr-2" />
              Dismiss
            </Button>
            <Button
              size="sm"
              onClick={() => setShowDetailDialog(false)}
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </>
  );
}
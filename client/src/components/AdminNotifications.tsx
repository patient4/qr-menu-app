import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, X, Volume2, VolumeX } from "lucide-react";
import { useWebSocket } from "@/lib/websocket";
import { formatTime } from "@/lib/utils";
import type { Order } from "@shared/schema";

interface Notification {
  id: string;
  type: "new_order" | "status_update";
  title: string;
  message: string;
  timestamp: Date;
  order?: Order;
}

interface AdminNotificationsProps {
  restaurantId: number;
}

export default function AdminNotifications({ restaurantId }: AdminNotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const createNotificationSound = useRef<() => void>();

  // Initialize audio
  useEffect(() => {
    // Create notification sound using Web Audio API
    createNotificationSound.current = () => {
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
      } catch (error) {
        console.warn("Could not create notification sound:", error);
      }
    };
  }, []);

  const playNotificationSound = () => {
    if (soundEnabled && createNotificationSound.current) {
      try {
        createNotificationSound.current();
      } catch (error) {
        console.warn("Could not play notification sound:", error);
      }
    }
  };

  // WebSocket for real-time notifications
  useWebSocket((message) => {
    if (message.type === "newOrder" && message.data.restaurantId === restaurantId) {
      const newNotification: Notification = {
        id: `new-order-${Date.now()}`,
        type: "new_order",
        title: "New Order Received! 🎉",
        message: `Order #${message.data.orderNumber} - Table ${message.data.tableNumber || "Takeaway"}`,
        timestamp: new Date(),
        order: message.data,
      };
      
      setNotifications(prev => [newNotification, ...prev.slice(0, 9)]);
      playNotificationSound();
      setIsExpanded(true);
      
      // Auto-collapse after 5 seconds
      setTimeout(() => setIsExpanded(false), 5000);
    }
    
    if (message.type === "orderStatusUpdate" && message.data.restaurantId === restaurantId) {
      const statusNotification: Notification = {
        id: `status-${Date.now()}`,
        type: "status_update",
        title: "Order Status Updated",
        message: `Order #${message.data.orderNumber} is now ${message.data.status}`,
        timestamp: new Date(),
        order: message.data,
      };
      
      setNotifications(prev => [statusNotification, ...prev.slice(0, 9)]);
    }
  });

  const clearNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    setIsExpanded(false);
  };

  const unreadCount = notifications.length;

  return (
    <div className="fixed top-4 right-4 z-50">
      {/* Notification Bell */}
      <div className="relative">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className={`relative ${unreadCount > 0 ? "bg-red-50 border-red-200 text-red-600" : ""}`}
        >
          <Bell className={`w-4 h-4 ${unreadCount > 0 ? "animate-bounce" : ""}`} />
          {unreadCount > 0 && (
            <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white text-xs">
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </div>

      {/* Notifications Panel */}
      {isExpanded && (
        <Card className="absolute top-12 right-0 w-80 max-h-96 overflow-hidden shadow-lg border border-gray-200">
          <div className="flex items-center justify-between p-3 border-b bg-gray-50">
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-sm">Notifications</h3>
              {unreadCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {unreadCount}
                </Badge>
              )}
            </div>
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="h-7 w-7 p-0"
              >
                {soundEnabled ? (
                  <Volume2 className="w-3 h-3" />
                ) : (
                  <VolumeX className="w-3 h-3" />
                )}
              </Button>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllNotifications}
                  className="h-7 px-2 text-xs"
                >
                  Clear All
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(false)}
                className="h-7 w-7 p-0"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>
          
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground text-sm">
                No new notifications
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                    notification.type === "new_order" ? "bg-green-50" : ""
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-medium text-sm text-gray-900 truncate">
                          {notification.title}
                        </h4>
                        {notification.type === "new_order" && (
                          <Badge className="bg-green-500 text-white text-xs">
                            NEW
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 mb-2">
                        {notification.message}
                      </p>
                      <div className="text-xs text-gray-400">
                        {formatTime(notification.timestamp)}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => clearNotification(notification.id)}
                      className="h-6 w-6 p-0 ml-2 opacity-50 hover:opacity-100"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
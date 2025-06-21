import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Clock, CheckCircle, ChefHat, Package, Sparkles } from "lucide-react";
import { formatTime, getOrderStatusColor } from "@/lib/utils";
import { useWebSocket } from "@/lib/websocket";
import type { Order } from "@shared/schema";

interface OrderProgressProps {
  orderNumber?: string;
}

export default function OrderProgress({ orderNumber }: OrderProgressProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasNewUpdate, setHasNewUpdate] = useState(false);

  // Fetch order details
  const { data: order, refetch } = useQuery<Order>({
    queryKey: [`/api/orders/by-number/${orderNumber}`],
    enabled: !!orderNumber,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // WebSocket for real-time updates
  useWebSocket((message) => {
    if (message.type === "orderStatusUpdate" && message.data.orderNumber === orderNumber) {
      setHasNewUpdate(true);
      refetch();
    }
  });

  useEffect(() => {
    if (hasNewUpdate && !isOpen) {
      // Auto-open when there's an update and dialog is closed
      const timer = setTimeout(() => setHasNewUpdate(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [hasNewUpdate, isOpen]);

  if (!orderNumber || !order) return null;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4" />;
      case "preparing":
        return <ChefHat className="w-4 h-4" />;
      case "ready":
        return <Package className="w-4 h-4" />;
      case "completed":
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusProgress = (status: string) => {
    switch (status) {
      case "pending":
        return 25;
      case "preparing":
        return 50;
      case "ready":
        return 75;
      case "completed":
        return 100;
      default:
        return 0;
    }
  };

  const getStatusMessage = (status: string) => {
    switch (status) {
      case "pending":
        return "Your order has been received and is being reviewed by our kitchen team.";
      case "preparing":
        return "Our chefs are carefully preparing your delicious meal with love and attention.";
      case "ready":
        return "Your order is ready for pickup! Please collect it from the counter.";
      case "completed":
        return "Order completed! Thank you for choosing us. We hope you enjoyed your meal!";
      default:
        return "Processing your order...";
    }
  };

  const isOrderActive = order.status !== "completed" && order.status !== "cancelled";

  return (
    <>
      {/* Floating Progress Button */}
      {isOrderActive && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            onClick={() => setIsOpen(true)}
            className={`rounded-full h-14 w-14 shadow-lg transition-all duration-300 hover:scale-110 ${
              hasNewUpdate 
                ? "bg-gradient-to-r from-green-500 to-emerald-500 animate-pulse" 
                : "bg-gradient-to-r from-orange-500 to-red-500"
            }`}
          >
            <div className="relative">
              {getStatusIcon(order.status)}
              {hasNewUpdate && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full animate-ping" />
              )}
            </div>
          </Button>
          
          {hasNewUpdate && (
            <div className="absolute -top-12 right-0 bg-white rounded-lg shadow-lg p-2 text-sm font-medium text-green-600 whitespace-nowrap animate-bounce">
              Order Updated! 🎉
            </div>
          )}
        </div>
      )}

      {/* Order Progress Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <span>Order Progress</span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Order Header */}
            <div className="text-center space-y-2">
              <div className="text-lg font-bold text-primary">#{order.orderNumber}</div>
              <Badge 
                className={`${getOrderStatusColor(order.status)} text-white`}
              >
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </Badge>
              <div className="text-sm text-muted-foreground">
                Ordered at {formatTime(order.createdAt || new Date())}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{getStatusProgress(order.status)}%</span>
              </div>
              <Progress value={getStatusProgress(order.status)} className="h-3" />
            </div>

            {/* Status Steps */}
            <div className="space-y-3">
              {["pending", "preparing", "ready", "completed"].map((status, index) => (
                <div 
                  key={status}
                  className={`flex items-center space-x-3 p-2 rounded-lg transition-colors ${
                    order.status === status 
                      ? "bg-primary/10 border border-primary/20" 
                      : getStatusProgress(order.status) > index * 25 
                        ? "bg-green-50 border border-green-200" 
                        : "bg-gray-50"
                  }`}
                >
                  <div className={`p-2 rounded-full ${
                    order.status === status 
                      ? "bg-primary text-white" 
                      : getStatusProgress(order.status) > index * 25 
                        ? "bg-green-500 text-white" 
                        : "bg-gray-300 text-gray-600"
                  }`}>
                    {getStatusIcon(status)}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium capitalize">{status}</div>
                    {order.status === status && (
                      <div className="text-sm text-muted-foreground">
                        {getStatusMessage(status)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Order Items Summary */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Order Items</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>{item.quantity}x {item.name}</span>
                      <span className="font-medium">₹{item.total}</span>
                    </div>
                  ))}
                  <div className="border-t pt-2 flex justify-between font-bold">
                    <span>Total</span>
                    <span>₹{order.total}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Estimated Time */}
            {order.status === "preparing" && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
                <div className="text-amber-700 font-medium">Estimated Preparation Time</div>
                <div className="text-2xl font-bold text-amber-800">12-15 minutes</div>
                <div className="text-sm text-amber-600">We're working hard to get your order ready!</div>
              </div>
            )}

            {/* Thank You Message */}
            {order.status === "completed" && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center space-y-2">
                <div className="text-2xl">🙏</div>
                <div className="font-bold text-green-800">Thank You!</div>
                <div className="text-green-700">
                  We hope you enjoyed your meal. Your satisfaction means the world to us!
                </div>
                <div className="text-sm text-green-600">
                  Please consider leaving us a review to help us serve you better.
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
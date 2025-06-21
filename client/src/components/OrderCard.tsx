import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Play, Check, Eye, Phone, Clock, MapPin, User, Utensils } from "lucide-react";
import { formatCurrency, formatTime, getOrderStatusColor, getOrderStatusText } from "@/lib/utils";
import type { Order } from "@shared/schema";

interface OrderCardProps {
  order: Order;
  onStatusUpdate: (orderId: number, status: string) => void;
  isUpdating?: boolean;
  showAllDetails?: boolean;
}

export default function OrderCard({ 
  order, 
  onStatusUpdate, 
  isUpdating = false,
  showAllDetails = false 
}: OrderCardProps) {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const getStatusActions = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Button
            size="sm"
            className="gradient-primary"
            onClick={() => onStatusUpdate(order.id, "preparing")}
            disabled={isUpdating}
          >
            <Play className="w-3 h-3 mr-1" />
            Start
          </Button>
        );
      case "preparing":
        return (
          <Button
            size="sm"
            className="bg-success text-success-foreground"
            onClick={() => onStatusUpdate(order.id, "ready")}
            disabled={isUpdating}
          >
            <Check className="w-3 h-3 mr-1" />
            Ready
          </Button>
        );
      case "ready":
        return (
          <Button
            size="sm"
            className="bg-warning text-warning-foreground"
            onClick={() => onStatusUpdate(order.id, "completed")}
            disabled={isUpdating}
          >
            <Check className="w-3 h-3 mr-1" />
            Complete
          </Button>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <Card className="border border-gray-200 hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center text-white font-bold">
                #{order.orderNumber.split('-').pop()}
              </div>
              <div>
                <p className="font-medium text-dark">
                  {order.orderType === "dine-in" ? `Table ${order.tableNumber}` : "Takeaway"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {order.orderType} • {formatTime(order.createdAt!)}
                </p>
              </div>
            </div>
            <Badge 
              className={`px-2 py-1 rounded-full text-xs font-medium ${getOrderStatusColor(order.status)}`}
            >
              {getOrderStatusText(order.status)}
            </Badge>
          </div>
          
          <div className="text-sm text-muted-foreground mb-3">
            {order.items.map(item => `${item.quantity}× ${item.name}`).join(", ")}
          </div>
          
          {showAllDetails && order.customerName && (
            <div className="text-sm text-muted-foreground mb-2">
              Customer: {order.customerName}
              {order.customerPhone && ` • ${order.customerPhone}`}
            </div>
          )}
          
          {order.notes && (
            <div className="text-sm text-muted-foreground mb-3 italic">
              Note: {order.notes}
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <span className="font-bold text-primary">
              {formatCurrency(order.total)}
            </span>
            <div className="flex space-x-2">
              {getStatusActions(order.status)}
              <Button
                size="sm"
                variant="outline"
                className="px-3 py-1"
                onClick={() => setIsDetailsOpen(true)}
              >
                <Eye className="w-3 h-3" />
              </Button>
              {order.orderType === "takeaway" && order.customerPhone && (
                <Button
                  size="sm"
                  variant="outline"
                  className="px-3 py-1"
                >
                  <Phone className="w-3 h-3" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Order Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <span>Order Details</span>
              <Badge className={`${getOrderStatusColor(order.status)}`}>
                {getOrderStatusText(order.status)}
              </Badge>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Order Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Utensils className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">Order #{order.orderNumber}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {formatTime(order.createdAt!)}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {order.orderType === "dine-in" 
                      ? `Table ${order.tableNumber || "N/A"}` 
                      : "Takeaway"
                    }
                  </span>
                </div>
              </div>
              
              {/* Customer Info */}
              {(order.customerName || order.customerPhone) && (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">Customer Details</span>
                  </div>
                  {order.customerName && (
                    <div className="text-sm text-muted-foreground">
                      Name: {order.customerName}
                    </div>
                  )}
                  {order.customerPhone && (
                    <div className="text-sm text-muted-foreground">
                      Phone: {order.customerPhone}
                    </div>
                  )}
                </div>
              )}
            </div>

            <Separator />

            {/* Order Items */}
            <div className="space-y-3">
              <h3 className="font-medium">Order Items</h3>
              <div className="space-y-2">
                {order.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {formatCurrency(item.price)} × {item.quantity}
                      </div>
                    </div>
                    <div className="font-medium">
                      {formatCurrency(item.total)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Order Total */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Service Charge</span>
                <span>{formatCurrency(order.serviceCharge)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>GST</span>
                <span>{formatCurrency(order.gst)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span className="text-primary">{formatCurrency(order.total)}</span>
              </div>
            </div>

            {/* Special Notes */}
            {order.notes && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h3 className="font-medium">Special Notes</h3>
                  <div className="p-3 bg-yellow-50 rounded-lg text-sm">
                    {order.notes}
                  </div>
                </div>
              </>
            )}

            {/* Action Buttons */}
            <div className="flex justify-between items-center pt-4">
              <div className="flex space-x-2">
                {getStatusActions(order.status)}
              </div>
              {order.orderType === "takeaway" && order.customerPhone && (
                <Button variant="outline" size="sm">
                  <Phone className="w-4 h-4 mr-2" />
                  Call Customer
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
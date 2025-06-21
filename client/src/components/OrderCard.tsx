import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Check, Eye, Phone } from "lucide-react";
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
            className="bg-success text-success-foreground"
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
    <Card className="border border-border rounded-xl">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <div className="w-8 h-8 gradient-primary text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
              {order.orderType === "takeaway" ? "T" : "#"}
              {order.orderType === "takeaway" ? order.id : order.tableNumber}
            </div>
            <div>
              <p className="font-semibold text-dark">
                {order.orderType === "takeaway" ? "Takeaway" : `Table ${order.tableNumber}`}
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
  );
}

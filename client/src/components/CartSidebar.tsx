import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Plus, Minus, ShoppingBag, Trash2 } from "lucide-react";
import { formatCurrency, calculateOrderTotal } from "@/lib/utils";
import type { MenuItem, Restaurant } from "@shared/schema";

interface CartItem extends MenuItem {
  quantity: number;
}

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onUpdateQuantity: (itemId: number, quantity: number) => void;
  onPlaceOrder: (customerInfo: { name?: string; phone?: string; notes?: string }) => void;
  isLoading: boolean;
  restaurant?: Restaurant;
  orderType: "dine-in" | "takeaway";
  tableNumber: string;
  onOrderTypeChange: (type: "dine-in" | "takeaway") => void;
  onTableNumberChange: (table: string) => void;
}

export default function CartSidebar({
  isOpen,
  onClose,
  cart,
  onUpdateQuantity,
  onPlaceOrder,
  isLoading,
  restaurant,
  orderType,
  tableNumber,
  onOrderTypeChange,
  onTableNumberChange,
}: CartSidebarProps) {
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [notes, setNotes] = useState("");

  const cartTotal = cart.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const { subtotal, serviceChargeAmount, gstAmount, total } = calculateOrderTotal(
    cart.map(item => ({ price: item.price, quantity: item.quantity })),
    restaurant?.serviceCharge ? parseFloat(restaurant.serviceCharge) : 10,
    restaurant?.gst ? parseFloat(restaurant.gst) : 5
  );

  const handlePlaceOrder = () => {
    onPlaceOrder({
      name: customerName || undefined,
      phone: customerPhone || undefined,
      notes: notes || undefined,
    });
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full max-w-md flex flex-col h-full">
        <SheetHeader>
          <SheetTitle className="font-poppins font-bold text-xl">Your Order</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {cart.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingBag className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Your cart is empty</p>
            </div>
          ) : (
            <>
              {/* Order Type Selection */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Order Type</Label>
                <Select value={orderType} onValueChange={onOrderTypeChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dine-in">Dine-in</SelectItem>
                    <SelectItem value="takeaway">Takeaway</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Table Number (for dine-in) */}
              {orderType === "dine-in" && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Table Number</Label>
                  <Input
                    value={tableNumber}
                    onChange={(e) => onTableNumberChange(e.target.value)}
                    placeholder="Enter table number"
                  />
                </div>
              )}

              {/* Customer Info (for takeaway) */}
              {orderType === "takeaway" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Name (Optional)</Label>
                    <Input
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Your name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Phone (Optional)</Label>
                    <Input
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="Your phone number"
                      type="tel"
                    />
                  </div>
                </div>
              )}

              {/* Cart Items */}
              <div className="space-y-3">
                <h3 className="font-semibold text-dark">Order Items</h3>
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-dark truncate">{item.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(item.price)} each
                      </p>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-8 h-8 rounded-full p-0"
                        onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="font-semibold text-primary min-w-[1.5rem] text-center">
                        {item.quantity}
                      </span>
                      <Button
                        size="sm"
                        className="gradient-primary w-8 h-8 rounded-full p-0"
                        onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Special Notes */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Special Instructions (Optional)</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any special requests or dietary requirements..."
                  rows={3}
                />
              </div>

              {/* Order Summary */}
              <div className="space-y-2">
                <Separator />
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Service Charge ({restaurant?.serviceCharge || 10}%)</span>
                    <span>{formatCurrency(serviceChargeAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>GST ({restaurant?.gst || 5}%)</span>
                    <span>{formatCurrency(gstAmount)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span className="text-primary">{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {cart.length > 0 && (
          <div className="border-t pt-4">
            <Button
              className="w-full gradient-primary font-semibold py-3"
              onClick={handlePlaceOrder}
              disabled={isLoading || (orderType === "dine-in" && !tableNumber.trim())}
            >
              {isLoading ? "Placing Order..." : `Place Order • ${formatCurrency(total)}`}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

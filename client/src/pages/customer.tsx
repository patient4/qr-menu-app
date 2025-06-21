import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ShoppingCart, Plus, Minus, Utensils, QrCode, MapPin, Clock, Star, Bell, Sparkles, ChefHat } from "lucide-react";
import { cn, formatCurrency, calculateOrderTotal } from "@/lib/utils";
import { useWebSocket } from "@/lib/websocket";
import MenuCard from "@/components/MenuCard";
import CartSidebar from "@/components/CartSidebar";
import OrderProgress from "@/components/OrderProgress";
import restaurantConfig from "@/config/restaurant.json";
import type { MenuItem, MenuCategory, Restaurant } from "@shared/schema";

interface CartItem extends MenuItem {
  quantity: number;
}

export default function CustomerApp() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [tableNumber, setTableNumber] = useState<string>("");
  const [orderType, setOrderType] = useState<"dine-in" | "takeaway">("dine-in");
  const [currentOrderNumber, setCurrentOrderNumber] = useState<string>("");
  const [orderStatus, setOrderStatus] = useState<string>("");
  const [estimatedTime, setEstimatedTime] = useState<number>(0);
  const [showOrderNotification, setShowOrderNotification] = useState(false);
  
  const { toast } = useToast();
  const restaurantId = restaurantConfig.id;

  // Persistent order tracking for guests and logged-in users
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tableParam = urlParams.get('table');
    if (tableParam) {
      setTableNumber(tableParam);
      setOrderType('dine-in');
    }

    // Restore order tracking from localStorage
    const savedOrderNumber = localStorage.getItem('currentOrderNumber');
    const savedOrderStatus = localStorage.getItem('currentOrderStatus');
    const savedEstimatedTime = localStorage.getItem('estimatedTime');
    
    if (savedOrderNumber) {
      setCurrentOrderNumber(savedOrderNumber);
      setOrderStatus(savedOrderStatus || 'pending');
      setEstimatedTime(parseInt(savedEstimatedTime || '0'));
    }
  }, []);

  // WebSocket for real-time order updates
  useWebSocket((message) => {
    if (message.type === "ORDER_STATUS_UPDATE" && message.data.orderNumber === currentOrderNumber) {
      setOrderStatus(message.data.status);
      
      // Persist order tracking data
      localStorage.setItem('currentOrderStatus', message.data.status);
      
      // Update cache directly for instant UI updates
      queryClient.setQueryData([`/api/orders/by-number/${currentOrderNumber}`], message.data);
      
      // Show notification for status updates
      setShowOrderNotification(true);
      setTimeout(() => setShowOrderNotification(false), 3000);
      
      // Status-specific notifications
      switch (message.data.status) {
        case 'preparing':
          toast({
            title: "🔥 Your order is being prepared!",
            description: "Our chefs are working on your delicious meal",
          });
          setEstimatedTime(15); // 15 minutes estimated
          break;
        case 'ready':
          toast({
            title: "🎉 Your order is ready!",
            description: orderType === 'dine-in' ? "We'll serve it to your table shortly" : "Please come to the counter to collect",
          });
          // Play notification sound
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Order Ready!', {
              body: 'Your order is ready for pickup/serving',
              icon: '/favicon.ico'
            });
          }
          break;
        case 'completed':
          toast({
            title: "✅ Order served successfully!",
            description: "Enjoy your meal! Please rate your experience",
          });
          // Reset tracking after completion
          setTimeout(() => {
            setCurrentOrderNumber("");
            setOrderStatus("");
          }, 5000);
          break;
      }
    }
  });

  // Get table number from URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const table = urlParams.get('table');
    if (table) {
      setTableNumber(table);
    } else {
      setTableNumber(restaurantConfig.settings.defaultTable);
    }
  }, []);

  // Fetch restaurant data
  const { data: restaurant } = useQuery<Restaurant>({
    queryKey: [`/api/restaurant/${restaurantId}`],
  });

  // Fetch menu categories
  const { data: categories = [] } = useQuery<MenuCategory[]>({
    queryKey: [`/api/restaurant/${restaurantId}/categories`],
  });

  // Fetch menu items
  const { data: menuItems = [] } = useQuery<MenuItem[]>({
    queryKey: [`/api/restaurant/${restaurantId}/menu`],
  });

  // Filter menu items by category
  const filteredItems = selectedCategory === "all" 
    ? menuItems 
    : menuItems.filter(item => 
        categories.find(cat => cat.id === item.categoryId)?.name.toLowerCase() === selectedCategory.toLowerCase()
      );

  // Cart functions
  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(cartItem => cartItem.id === item.id);
      if (existing) {
        return prev.map(cartItem =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
    
    toast({
      title: "Added to cart",
      description: `${item.name} added to your order`,
    });
  };

  const removeFromCart = (itemId: number) => {
    setCart(prev => {
      const existing = prev.find(cartItem => cartItem.id === itemId);
      if (existing && existing.quantity > 1) {
        return prev.map(cartItem =>
          cartItem.id === itemId
            ? { ...cartItem, quantity: cartItem.quantity - 1 }
            : cartItem
        );
      }
      return prev.filter(cartItem => cartItem.id !== itemId);
    });
  };

  const getItemQuantity = (itemId: number) => {
    return cart.find(item => item.id === itemId)?.quantity || 0;
  };

  const cartTotal = cart.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Place order mutation
  const placeOrderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      const response = await apiRequest("POST", "/api/orders", orderData);
      return response.json();
    },
    onSuccess: (data) => {
      setCart([]);
      setIsCartOpen(false);
      setCurrentOrderNumber(data.orderNumber);
      setOrderStatus('pending');
      
      // Persist order tracking data for reload persistence
      localStorage.setItem('currentOrderNumber', data.orderNumber);
      localStorage.setItem('currentOrderStatus', 'pending');
      localStorage.setItem('estimatedTime', '20');
      
      toast({
        title: "Order placed successfully!",
        description: "Your order has been sent to the kitchen. Track your progress with the floating button.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to place order",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handlePlaceOrder = (customerInfo: { name?: string; phone?: string; notes?: string }) => {
    if (cart.length === 0) return;

    const orderItems = cart.map(item => ({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      total: (parseFloat(item.price) * item.quantity).toFixed(2),
    }));

    const { subtotal, serviceChargeAmount, gstAmount, total } = calculateOrderTotal(
      cart.map(item => ({ price: item.price, quantity: item.quantity })),
      restaurant?.serviceCharge ? parseFloat(restaurant.serviceCharge) : 10,
      restaurant?.gst ? parseFloat(restaurant.gst) : 5
    );

    const orderData = {
      restaurantId,
      tableNumber: orderType === "dine-in" ? tableNumber : null,
      orderType,
      items: orderItems,
      subtotal: subtotal.toFixed(2),
      serviceCharge: serviceChargeAmount.toFixed(2),
      gst: gstAmount.toFixed(2),
      total: total.toFixed(2),
      customerName: customerInfo.name || null,
      customerPhone: customerInfo.phone || null,
      notes: customerInfo.notes || null,
    };

    placeOrderMutation.mutate(orderData);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <div className="mobile-header bg-white shadow-sm p-4 flex items-center justify-between">
        <div className="flex items-center">
          <div className="w-10 h-10 gradient-primary rounded-full flex items-center justify-center mr-3">
            <Utensils className="text-white text-lg" />
          </div>
          <div>
            <h1 className="font-poppins font-bold text-lg text-dark">
              {restaurant?.name || restaurantConfig.name}
            </h1>
            <p className="text-sm text-muted-foreground">
              {orderType === "dine-in" ? `Table #${tableNumber}` : "Takeaway"} • {orderType}
            </p>
          </div>
        </div>
        <div className="relative">
          <Button
            variant="default"
            size="sm"
            className="gradient-primary rounded-full relative"
            onClick={() => setIsCartOpen(true)}
          >
            <ShoppingCart className="w-4 h-4" />
            {cartItemCount > 0 && (
              <Badge className="absolute -top-2 -right-2 bg-secondary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center p-0">
                {cartItemCount}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      {/* Order Type Toggle */}
      <div className="px-4 py-3 bg-white border-b">
        <div className="flex space-x-2">
          <Button
            variant={orderType === "dine-in" ? "default" : "outline"}
            size="sm"
            onClick={() => setOrderType("dine-in")}
            className={orderType === "dine-in" ? "gradient-primary" : ""}
          >
            <MapPin className="w-4 h-4 mr-1" />
            Dine-in
          </Button>
          <Button
            variant={orderType === "takeaway" ? "default" : "outline"}
            size="sm"
            onClick={() => setOrderType("takeaway")}
            className={orderType === "takeaway" ? "gradient-primary" : ""}
          >
            <Clock className="w-4 h-4 mr-1" />
            Takeaway
          </Button>
        </div>
      </div>

      {/* Category Pills */}
      <div className="px-4 py-3 bg-white border-b">
        <div className="flex space-x-3 overflow-x-auto scrollbar-hide">
          <Button
            variant={selectedCategory === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory("all")}
            className={cn(
              "whitespace-nowrap font-medium rounded-full",
              selectedCategory === "all" && "gradient-primary"
            )}
          >
            All Items
          </Button>
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.name.toLowerCase() ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category.name.toLowerCase())}
              className={cn(
                "whitespace-nowrap font-medium rounded-full",
                selectedCategory === category.name.toLowerCase() && "gradient-primary"
              )}
            >
              {category.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Featured Banner */}
      <div className="px-4 py-2">
        <Card className="gradient-primary text-white mb-6 relative overflow-hidden">
          <CardContent className="p-4">
            <div className="relative z-10">
              <h2 className="font-poppins font-bold text-xl mb-2">Today's Special</h2>
              <p className="opacity-90 mb-3">Authentic homestyle flavors with a modern twist</p>
              <Button
                variant="secondary"
                size="sm"
                className="bg-white text-primary font-semibold"
              >
                Explore Menu
              </Button>
            </div>
            <div className="absolute right-4 top-4 opacity-20">
              <Star className="w-16 h-16" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Menu Items */}
      <div className="px-4 pb-2 space-y-4">
        {filteredItems.map((item) => (
          <MenuCard
            key={item.id}
            item={item}
            quantity={getItemQuantity(item.id)}
            onAdd={() => addToCart(item)}
            onRemove={() => removeFromCart(item.id)}
          />
        ))}
      </div>

      {/* QR Code Section */}
      <div className="mt-8 p-4">
        <Card>
          <CardContent className="p-6 text-center">
            <h3 className="font-poppins font-bold text-lg mb-4">Share this Menu</h3>
            <div className="bg-muted p-4 rounded-xl mb-4 inline-block">
              <div className="w-32 h-32 bg-dark rounded-lg flex items-center justify-center">
                <QrCode className="text-white text-4xl" />
              </div>
            </div>
            <p className="text-muted-foreground text-sm">Scan QR code to access this menu</p>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Navigation */}
      {cartItemCount > 0 && (
        <div className="mobile-bottom-nav bg-white border-t border-gray-200 px-4 py-2 glass-effect">
          <div className="flex justify-between items-center mb-2">
            <div>
              <span className="text-sm text-muted-foreground">
                Total: {cartItemCount} items
              </span>
              <div className="font-bold text-lg text-dark">
                {formatCurrency(cartTotal)}
              </div>
            </div>
            <Button
              className="gradient-primary font-semibold flex items-center space-x-2"
              onClick={() => setIsCartOpen(true)}
            >
              <ShoppingCart className="w-4 h-4" />
              <span>View Cart</span>
            </Button>
          </div>
        </div>
      )}

      {/* Cart Sidebar */}
      <CartSidebar
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQuantity={(itemId, quantity) => {
          if (quantity === 0) {
            removeFromCart(itemId);
          } else {
            setCart(prev =>
              prev.map(item =>
                item.id === itemId ? { ...item, quantity } : item
              )
            );
          }
        }}
        onPlaceOrder={handlePlaceOrder}
        isLoading={placeOrderMutation.isPending}
        restaurant={restaurant}
        orderType={orderType}
        tableNumber={tableNumber}
        onOrderTypeChange={setOrderType}
        onTableNumberChange={setTableNumber}
      />

      {/* Enhanced Order Progress with Real-time Features */}
      {currentOrderNumber && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className={`transition-all duration-300 ${showOrderNotification ? 'animate-pulse' : ''}`}>
            <OrderProgress orderNumber={currentOrderNumber} />
          </div>
          
          {/* Real-time Status Notification */}
          {showOrderNotification && (
            <div className="absolute -top-12 right-0 bg-primary text-white px-3 py-1 rounded-lg text-sm font-medium animate-bounce">
              Status Updated!
            </div>
          )}
          
          {/* Estimated Time Display */}
          {estimatedTime > 0 && orderStatus === 'preparing' && (
            <div className="absolute -top-8 -left-20 bg-orange-500 text-white px-2 py-1 rounded-lg text-xs font-medium">
              <Clock className="w-3 h-3 inline mr-1" />
              ~{estimatedTime} min
            </div>
          )}
        </div>
      )}

      {/* Customer Satisfaction Tools */}
      <div className="fixed bottom-4 left-4 z-40 space-y-2">
        {/* Call Waiter - Dine-in Only */}
        {orderType === 'dine-in' && currentOrderNumber && (
          <Button
            variant="outline"
            size="sm"
            className="bg-white shadow-lg hover:bg-yellow-50 border-yellow-300"
            onClick={() => {
              toast({
                title: "Waiter called for Table " + tableNumber,
                description: "Someone will assist you shortly",
              });
            }}
          >
            <Bell className="w-4 h-4 mr-2" />
            Call Waiter
          </Button>
        )}
        
        {/* Quick Feedback */}
        {currentOrderNumber && orderStatus === 'completed' && (
          <Button
            variant="outline"
            size="sm"
            className="bg-white shadow-lg hover:bg-green-50 border-green-300"
            onClick={() => {
              toast({
                title: "Thank you for dining with us!",
                description: "Your feedback helps us improve",
              });
            }}
          >
            <Star className="w-4 h-4 mr-2" />
            Rate Us
          </Button>
        )}

        {/* Special Requests */}
        {currentOrderNumber && orderStatus !== 'completed' && (
          <Button
            variant="outline"
            size="sm"
            className="bg-white shadow-lg hover:bg-blue-50 border-blue-300"
            onClick={() => {
              toast({
                title: "Special request noted",
                description: "Kitchen staff has been informed",
              });
            }}
          >
            <ChefHat className="w-4 h-4 mr-2" />
            Special Request
          </Button>
        )}
      </div>

      <div className="h-24"></div>
    </div>
  );
}

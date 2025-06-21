import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useWebSocket } from "@/lib/websocket";
import { 
  BarChart3, 
  ShoppingCart, 
  IndianRupee, 
  Clock, 
  Star, 
  Bell, 
  Download,
  Play,
  Check,
  Eye,
  Phone,
  Settings,
  TrendingUp
} from "lucide-react";
import { cn, formatCurrency, formatTime, getOrderStatusColor, getOrderStatusText } from "@/lib/utils";
import OrderCard from "@/components/OrderCard";
import restaurantConfig from "@/config/restaurant.json";
import type { Order, Restaurant } from "@shared/schema";

interface DashboardStats {
  orderCount: number;
  revenue: number;
  avgPrepTime: number;
  popularItems: Array<{ name: string; count: number }>;
}

export default function AdminApp() {
  const [selectedOrderStatus, setSelectedOrderStatus] = useState<string>("all");
  const [notifications, setNotifications] = useState<number>(0);
  const { toast } = useToast();
  
  const restaurantId = restaurantConfig.id;

  // WebSocket for real-time updates
  useWebSocket((message) => {
    switch (message.type) {
      case 'NEW_ORDER':
        setNotifications(prev => prev + 1);
        toast({
          title: "New Order Received!",
          description: `Order #${message.data.orderNumber} from ${message.data.orderType === 'dine-in' ? `Table ${message.data.tableNumber}` : 'Takeaway'}`,
        });
        queryClient.invalidateQueries({ queryKey: [`/api/restaurant/${restaurantId}/orders`] });
        queryClient.invalidateQueries({ queryKey: [`/api/restaurant/${restaurantId}/stats`] });
        break;
      case 'ORDER_STATUS_UPDATE':
        queryClient.invalidateQueries({ queryKey: [`/api/restaurant/${restaurantId}/orders`] });
        break;
    }
  });

  // Fetch restaurant data
  const { data: restaurant } = useQuery<Restaurant>({
    queryKey: [`/api/restaurant/${restaurantId}`],
  });

  // Fetch orders
  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: [`/api/restaurant/${restaurantId}/orders`],
  });

  // Fetch dashboard stats
  const { data: stats } = useQuery<DashboardStats>({
    queryKey: [`/api/restaurant/${restaurantId}/stats`],
  });

  // Filter orders by status
  const filteredOrders = selectedOrderStatus === "all" 
    ? orders 
    : orders.filter(order => order.status === selectedOrderStatus);

  // Live orders (pending and preparing)
  const liveOrders = orders.filter(order => 
    order.status === "pending" || order.status === "preparing"
  );

  // Update order status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: number; status: string }) => {
      const response = await apiRequest("PATCH", `/api/orders/${orderId}/status`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/restaurant/${restaurantId}/orders`] });
      queryClient.invalidateQueries({ queryKey: [`/api/restaurant/${restaurantId}/stats`] });
    },
    onError: () => {
      toast({
        title: "Failed to update order",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleStatusUpdate = (orderId: number, status: string) => {
    updateStatusMutation.mutate({ orderId, status });
  };

  // Export data function
  const handleExportData = () => {
    // Simple CSV export functionality
    const csvData = orders.map(order => ({
      OrderNumber: order.orderNumber,
      Date: formatTime(order.createdAt!),
      Type: order.orderType,
      Table: order.tableNumber || 'N/A',
      Items: order.items.map(item => `${item.name} x${item.quantity}`).join('; '),
      Total: order.total,
      Status: order.status
    }));
    
    const csvContent = [
      Object.keys(csvData[0] || {}).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast({
      title: "Data exported successfully",
      description: "Orders data has been downloaded as CSV file.",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Admin Header */}
      <div className="bg-white shadow-sm p-6 border-b">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="flex items-center mb-4 md:mb-0">
            <div className="w-12 h-12 gradient-secondary rounded-xl flex items-center justify-center mr-4">
              <BarChart3 className="text-white text-xl" />
            </div>
            <div>
              <h1 className="font-poppins font-bold text-2xl text-dark">Admin Dashboard</h1>
              <p className="text-muted-foreground">
                {restaurant?.name || restaurantConfig.name} Management
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={handleExportData}
              className="font-medium"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Data
            </Button>
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                className="relative"
                onClick={() => setNotifications(0)}
              >
                <Bell className="w-4 h-4" />
                {notifications > 0 && (
                  <Badge className="absolute -top-1 -right-1 bg-secondary text-white text-xs rounded-full w-4 h-4 flex items-center justify-center p-0">
                    {notifications}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {/* Dashboard Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                      <ShoppingCart className="text-blue-600 text-xl" />
                    </div>
                    <span className="text-green-500 text-sm font-medium">+12%</span>
                  </div>
                  <h3 className="text-2xl font-bold text-dark mb-1">
                    {stats?.orderCount || 0}
                  </h3>
                  <p className="text-muted-foreground">Today's Orders</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                      <IndianRupee className="text-green-600 text-xl" />
                    </div>
                    <span className="text-green-500 text-sm font-medium">+8%</span>
                  </div>
                  <h3 className="text-2xl font-bold text-dark mb-1">
                    {formatCurrency(stats?.revenue || 0)}
                  </h3>
                  <p className="text-muted-foreground">Today's Revenue</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                      <Clock className="text-orange-600 text-xl" />
                    </div>
                    <span className="text-orange-500 text-sm font-medium">5 mins</span>
                  </div>
                  <h3 className="text-2xl font-bold text-dark mb-1">
                    {stats?.avgPrepTime || 0}
                  </h3>
                  <p className="text-muted-foreground">Avg Prep Time</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                      <Star className="text-purple-600 text-xl" />
                    </div>
                    <span className="text-green-500 text-sm font-medium">4.8/5</span>
                  </div>
                  <h3 className="text-2xl font-bold text-dark mb-1">95%</h3>
                  <p className="text-muted-foreground">Customer Satisfaction</p>
                </CardContent>
              </Card>
            </div>

            {/* Live Orders and Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Live Orders */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="font-poppins font-bold text-xl text-dark">
                      Live Orders
                    </CardTitle>
                    <Badge className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
                      Live
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {liveOrders.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No active orders
                      </div>
                    ) : (
                      liveOrders.map((order) => (
                        <OrderCard
                          key={order.id}
                          order={order}
                          onStatusUpdate={handleStatusUpdate}
                          isUpdating={updateStatusMutation.isPending}
                        />
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Analytics */}
              <Card>
                <CardHeader>
                  <CardTitle className="font-poppins font-bold text-xl text-dark">
                    Today's Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Chart Placeholder */}
                  <div className="h-64 bg-muted rounded-xl flex flex-col items-center justify-center mb-6">
                    <TrendingUp className="text-4xl text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">Revenue & Orders Trend</p>
                  </div>

                  {/* Popular Items */}
                  <div className="border-t pt-4">
                    <h3 className="font-semibold text-dark mb-4">Most Popular Items</h3>
                    <div className="space-y-3">
                      {stats?.popularItems?.map((item, index) => (
                        <div key={item.name} className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className={cn(
                              "w-8 h-8 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3",
                              index === 0 ? "bg-primary" : index === 1 ? "bg-secondary" : "bg-accent"
                            )}>
                              {index + 1}
                            </div>
                            <span className="text-dark font-medium">{item.name}</span>
                          </div>
                          <span className="text-muted-foreground">{item.count} orders</span>
                        </div>
                      )) || (
                        <div className="text-center py-4 text-muted-foreground">
                          No data available
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="orders" className="space-y-6">
            {/* Order Status Filter */}
            <div className="flex space-x-2 overflow-x-auto">
              <Button
                variant={selectedOrderStatus === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedOrderStatus("all")}
                className={selectedOrderStatus === "all" ? "gradient-primary" : ""}
              >
                All Orders ({orders.length})
              </Button>
              <Button
                variant={selectedOrderStatus === "pending" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedOrderStatus("pending")}
                className={selectedOrderStatus === "pending" ? "gradient-primary" : ""}
              >
                Pending ({orders.filter(o => o.status === "pending").length})
              </Button>
              <Button
                variant={selectedOrderStatus === "preparing" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedOrderStatus("preparing")}
                className={selectedOrderStatus === "preparing" ? "gradient-primary" : ""}
              >
                Preparing ({orders.filter(o => o.status === "preparing").length})
              </Button>
              <Button
                variant={selectedOrderStatus === "ready" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedOrderStatus("ready")}
                className={selectedOrderStatus === "ready" ? "gradient-primary" : ""}
              >
                Ready ({orders.filter(o => o.status === "ready").length})
              </Button>
            </div>

            {/* Orders List */}
            <div className="space-y-4">
              {filteredOrders.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <ShoppingCart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No orders found</p>
                  </CardContent>
                </Card>
              ) : (
                filteredOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onStatusUpdate={handleStatusUpdate}
                    isUpdating={updateStatusMutation.isPending}
                    showAllDetails
                  />
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            {/* Restaurant Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="font-poppins font-bold text-xl text-dark">
                  Restaurant Configuration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-muted-foreground">
                      Restaurant Name
                    </Label>
                    <Input
                      defaultValue={restaurant?.name || restaurantConfig.name}
                      className="focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-muted-foreground">
                      Primary Color
                    </Label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        defaultValue={restaurant?.primaryColor || restaurantConfig.colors.primary}
                        className="w-12 h-10 border border-input rounded-lg"
                      />
                      <Input
                        defaultValue={restaurant?.primaryColor || restaurantConfig.colors.primary}
                        className="flex-1 focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-muted-foreground">
                      Order Mode
                    </Label>
                    <Select defaultValue="both">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="both">Dine-in + Takeaway</SelectItem>
                        <SelectItem value="dine-in">Dine-in Only</SelectItem>
                        <SelectItem value="takeaway">Takeaway Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-muted-foreground">
                      Table Count
                    </Label>
                    <Input
                      type="number"
                      defaultValue={restaurant?.tableCount || restaurantConfig.settings.tableCount}
                      className="focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-muted-foreground">
                      Service Charge (%)
                    </Label>
                    <Input
                      type="number"
                      defaultValue={restaurant?.serviceCharge || restaurantConfig.settings.serviceCharge}
                      className="focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-muted-foreground">
                      GST (%)
                    </Label>
                    <Input
                      type="number"
                      defaultValue={restaurant?.gst || restaurantConfig.settings.gst}
                      className="focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div className="flex justify-end mt-6 space-x-3">
                  <Button variant="outline">
                    Reset
                  </Button>
                  <Button className="gradient-primary">
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Subscription Status */}
            <Card className="gradient-primary text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-poppins font-bold text-xl mb-2">Subscription Status</h3>
                    <p className="opacity-90 mb-1">Free Trial • 18 days remaining</p>
                    <p className="text-sm opacity-75">Upgrade to Pro for ₹4,999/month</p>
                  </div>
                  <div className="text-right">
                    <Button className="bg-white text-primary font-semibold mb-2">
                      Upgrade Now
                    </Button>
                    <div className="text-sm opacity-75">Next billing: Dec 15, 2024</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useWebSocket } from "@/lib/websocket";
import { 
  Building2, Users, DollarSign, Activity, Eye, Settings, 
  Search, Filter, Crown, Shield, Database, TrendingUp,
  Calendar, Clock, AlertTriangle, CheckCircle, XCircle
} from "lucide-react";
import { formatCurrency, formatDate, formatTime } from "@/lib/utils";
import type { Restaurant, Order, User } from "@shared/schema";

interface SuperAdminStats {
  totalRestaurants: number;
  activeSubscriptions: number;
  totalRevenue: number;
  totalOrders: number;
  trialRestaurants: number;
  expiredSubscriptions: number;
}

interface RestaurantAnalytics {
  restaurantId: number;
  name: string;
  ordersToday: number;
  revenueToday: number;
  avgOrderValue: number;
  subscriptionStatus: string;
  lastActivity: Date;
}

export default function SuperAdminApp() {
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [viewMode, setViewMode] = useState<"overview" | "restaurants" | "orders" | "analytics">("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [realTimeUpdates, setRealTimeUpdates] = useState(0);

  const { toast } = useToast();

  // WebSocket for real-time monitoring
  useWebSocket((message) => {
    setRealTimeUpdates(prev => prev + 1);
    
    switch (message.type) {
      case 'NEW_ORDER':
        toast({
          title: `New Order - ${message.data.restaurantName}`,
          description: `Order #${message.data.orderNumber} - ${formatCurrency(message.data.total)}`,
        });
        break;
      case 'SUBSCRIPTION_UPDATE':
        toast({
          title: "Subscription Updated",
          description: `${message.data.restaurantName} subscription status changed`,
        });
        break;
      case 'TRIAL_EXPIRING':
        toast({
          title: "Trial Expiring",
          description: `${message.data.restaurantName} trial expires in ${message.data.daysLeft} days`,
          variant: "destructive",
        });
        break;
    }

    // Invalidate relevant queries for real-time updates
    queryClient.invalidateQueries({ queryKey: ['/api/super-admin/stats'] });
    queryClient.invalidateQueries({ queryKey: ['/api/super-admin/restaurants'] });
  });

  // Fetch super admin stats
  const { data: stats } = useQuery<SuperAdminStats>({
    queryKey: ['/api/super-admin/stats'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch all restaurants
  const { data: restaurants } = useQuery<Restaurant[]>({
    queryKey: ['/api/super-admin/restaurants'],
    refetchInterval: 30000,
  });

  // Fetch restaurant analytics
  const { data: analytics } = useQuery<RestaurantAnalytics[]>({
    queryKey: ['/api/super-admin/analytics'],
    refetchInterval: 60000, // Refresh every minute
  });

  // Fetch all orders (readonly monitoring)
  const { data: allOrders } = useQuery<Order[]>({
    queryKey: ['/api/super-admin/orders'],
    refetchInterval: 15000, // Refresh every 15 seconds
  });

  // Filter restaurants based on search and status
  const filteredRestaurants = restaurants?.filter(restaurant => {
    const matchesSearch = restaurant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         restaurant.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterStatus === "all") return matchesSearch;
    if (filterStatus === "active") return matchesSearch && restaurant.isActive;
    if (filterStatus === "trial") return matchesSearch && restaurant.subscriptionEndDate && new Date(restaurant.subscriptionEndDate) > new Date();
    if (filterStatus === "expired") return matchesSearch && (!restaurant.subscriptionEndDate || new Date(restaurant.subscriptionEndDate) < new Date());
    
    return matchesSearch;
  }) || [];

  // Subscription management mutations
  const updateSubscriptionMutation = useMutation({
    mutationFn: async ({ restaurantId, action }: { restaurantId: number; action: string }) => {
      const response = await fetch(`/api/super-admin/restaurants/${restaurantId}/subscription`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      if (!response.ok) throw new Error('Failed to update subscription');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Subscription updated successfully",
        description: "Restaurant access has been modified",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/super-admin/restaurants'] });
    },
  });

  const getSubscriptionBadge = (restaurant: Restaurant) => {
    const now = new Date();
    const endDate = restaurant.subscriptionEndDate ? new Date(restaurant.subscriptionEndDate) : null;
    
    if (!endDate) {
      return <Badge variant="secondary">No Subscription</Badge>;
    }
    
    const daysLeft = endDate ? Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0;
    
    if (daysLeft < 0) {
      return <Badge variant="destructive">Expired</Badge>;
    } else if (daysLeft <= 7) {
      return <Badge variant="outline" className="border-orange-500 text-orange-600">Trial ({daysLeft}d left)</Badge>;
    } else if (daysLeft <= 30) {
      return <Badge variant="outline" className="border-blue-500 text-blue-600">Trial ({daysLeft}d left)</Badge>;
    } else {
      return <Badge variant="default" className="bg-green-500">Active</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <Crown className="w-8 h-8 text-yellow-500" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Super Admin Portal</h1>
                  <p className="text-sm text-gray-500">Multi-Restaurant Management System</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Activity className="w-4 h-4" />
                <span>Live Updates: {realTimeUpdates}</span>
              </div>
              <Badge variant="outline" className="border-green-500 text-green-600">
                <Shield className="w-3 h-3 mr-1" />
                Super Admin
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs value={viewMode} onValueChange={(value: any) => setViewMode(value)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="restaurants">Restaurants</TabsTrigger>
            <TabsTrigger value="orders">Live Orders</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Restaurants</CardTitle>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalRestaurants || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats?.activeSubscriptions || 0} active subscriptions
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(stats?.totalRevenue || 0)}</div>
                  <p className="text-xs text-muted-foreground">
                    Across all restaurants
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalOrders || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    All time orders processed
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Trial Accounts</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.trialRestaurants || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats?.expiredSubscriptions || 0} expired
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Restaurant Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics?.slice(0, 5).map((restaurant) => (
                    <div key={restaurant.restaurantId} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{restaurant.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {restaurant.ordersToday} orders today • {formatCurrency(restaurant.revenueToday)} revenue
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{formatCurrency(restaurant.avgOrderValue)}</p>
                        <p className="text-xs text-muted-foreground">avg order</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Restaurants Tab */}
          <TabsContent value="restaurants" className="space-y-6">
            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search restaurants..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Restaurants</SelectItem>
                  <SelectItem value="active">Active Subscriptions</SelectItem>
                  <SelectItem value="trial">Trial Accounts</SelectItem>
                  <SelectItem value="expired">Expired Accounts</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Restaurants Table */}
            <Card>
              <CardHeader>
                <CardTitle>Restaurant Management</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Restaurant</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Subscription</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRestaurants.map((restaurant) => (
                      <TableRow key={restaurant.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{restaurant.name}</p>
                            <p className="text-sm text-muted-foreground">{restaurant.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={restaurant.isActive ? "default" : "secondary"}>
                            {restaurant.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {restaurant.createdAt ? formatDate(restaurant.createdAt) : "N/A"}
                        </TableCell>
                        <TableCell>
                          {getSubscriptionBadge(restaurant)}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setSelectedRestaurant(restaurant)}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>Restaurant Details</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label>Name</Label>
                                      <p className="text-sm">{restaurant.name}</p>
                                    </div>
                                    <div>
                                      <Label>Email</Label>
                                      <p className="text-sm">{restaurant.email || "Not provided"}</p>
                                    </div>
                                    <div>
                                      <Label>Phone</Label>
                                      <p className="text-sm">{restaurant.phone || "Not provided"}</p>
                                    </div>
                                    <div>
                                      <Label>Address</Label>
                                      <p className="text-sm">{restaurant.address || "Not provided"}</p>
                                    </div>
                                  </div>
                                  
                                  <div className="flex space-x-2">
                                    <Button
                                      variant="outline"
                                      onClick={() => updateSubscriptionMutation.mutate({
                                        restaurantId: restaurant.id,
                                        action: restaurant.isActive ? 'suspend' : 'activate'
                                      })}
                                      disabled={updateSubscriptionMutation.isPending}
                                    >
                                      {restaurant.isActive ? 'Suspend' : 'Activate'}
                                    </Button>
                                    <Button
                                      variant="outline"
                                      onClick={() => updateSubscriptionMutation.mutate({
                                        restaurantId: restaurant.id,
                                        action: 'extend_trial'
                                      })}
                                      disabled={updateSubscriptionMutation.isPending}
                                    >
                                      Extend Trial
                                    </Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Live Orders Tab */}
          <TabsContent value="orders" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Database className="w-5 h-5" />
                  <span>Live Order Monitoring (Read-Only)</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order #</TableHead>
                      <TableHead>Restaurant</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allOrders?.slice(0, 20).map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono text-sm">
                          {order.orderNumber}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">Restaurant #{order.restaurantId}</p>
                            <p className="text-xs text-muted-foreground">
                              {order.orderType} • Table {order.tableNumber || "N/A"}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            order.status === 'completed' ? 'default' :
                            order.status === 'preparing' ? 'secondary' :
                            order.status === 'ready' ? 'outline' : 'destructive'
                          }>
                            {order.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatCurrency(order.total)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {order.createdAt ? formatTime(order.createdAt) : "N/A"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Restaurant Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics?.map((restaurant) => (
                      <div key={restaurant.restaurantId} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{restaurant.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {restaurant.ordersToday} orders • Avg: {formatCurrency(restaurant.avgOrderValue)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">{formatCurrency(restaurant.revenueToday)}</p>
                          <p className="text-xs text-muted-foreground">today</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>System Health</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Active Restaurants</span>
                      <Badge variant="default">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        {stats?.activeSubscriptions || 0}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Trial Expiring Soon</span>
                      <Badge variant="outline" className="border-orange-500 text-orange-600">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        {stats?.trialRestaurants || 0}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Expired Subscriptions</span>
                      <Badge variant="destructive">
                        <XCircle className="w-3 h-3 mr-1" />
                        {stats?.expiredSubscriptions || 0}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
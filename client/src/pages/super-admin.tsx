import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { 
  Building2, 
  Users, 
  DollarSign, 
  ShoppingBag, 
  TrendingUp, 
  Calendar,
  Settings,
  Plus,
  Eye,
  Pause,
  Play,
  Clock,
  MapPin,
  Phone,
  Mail,
  Crown,
  AlertTriangle
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Restaurant } from "@shared/schema";

const createRestaurantSchema = z.object({
  name: z.string().min(1, "Restaurant name is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Invalid email").optional(),
  primaryColor: z.string().default("#FF6B35"),
  secondaryColor: z.string().default("#C62828"),
  accentColor: z.string().default("#FFB300"),
  tableCount: z.number().min(1).default(10),
  serviceCharge: z.string().default("10.00"),
  gst: z.string().default("5.00"),
});

type CreateRestaurantFormData = z.infer<typeof createRestaurantSchema>;

export default function SuperAdminApp() {
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { toast } = useToast();

  // Fetch super admin stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/super-admin/stats'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch all restaurants
  const { data: restaurants = [], isLoading: restaurantsLoading } = useQuery({
    queryKey: ['/api/super-admin/restaurants'],
    refetchInterval: 30000,
  });

  // Fetch all orders
  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ['/api/super-admin/orders'],
    refetchInterval: 30000,
  });

  // Fetch analytics data
  const { data: analytics = [], isLoading: analyticsLoading } = useQuery({
    queryKey: ['/api/super-admin/analytics'],
    refetchInterval: 60000, // Refresh every minute
  });

  // Create restaurant form
  const createForm = useForm<CreateRestaurantFormData>({
    resolver: zodResolver(createRestaurantSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      address: "",
      phone: "",
      email: "",
      primaryColor: "#FF6B35",
      secondaryColor: "#C62828",
      accentColor: "#FFB300",
      tableCount: 10,
      serviceCharge: "10.00",
      gst: "5.00",
    },
  });

  // Subscription management mutation
  const subscriptionMutation = useMutation({
    mutationFn: async ({ restaurantId, action }: { restaurantId: number; action: string }) => {
      const response = await apiRequest("PATCH", `/api/super-admin/restaurants/${restaurantId}/subscription`, { action });
      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/super-admin/restaurants'] });
      queryClient.invalidateQueries({ queryKey: ['/api/super-admin/stats'] });
      
      const actionLabels = {
        activate: 'activated',
        suspend: 'suspended',
        extend_trial: 'trial extended'
      };
      
      toast({
        title: "Subscription Updated",
        description: `Restaurant subscription ${actionLabels[variables.action as keyof typeof actionLabels]}.`,
      });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update restaurant subscription.",
        variant: "destructive",
      });
    },
  });

  // Create restaurant mutation
  const createRestaurantMutation = useMutation({
    mutationFn: async (data: CreateRestaurantFormData) => {
      const response = await apiRequest("POST", "/api/restaurants", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/super-admin/restaurants'] });
      queryClient.invalidateQueries({ queryKey: ['/api/super-admin/stats'] });
      setIsCreateDialogOpen(false);
      createForm.reset();
      toast({
        title: "Restaurant Created",
        description: "New restaurant has been successfully created.",
      });
    },
    onError: () => {
      toast({
        title: "Creation Failed",
        description: "Failed to create restaurant.",
        variant: "destructive",
      });
    },
  });

  const handleSubscriptionAction = (restaurantId: number, action: string) => {
    subscriptionMutation.mutate({ restaurantId, action });
  };

  const onCreateSubmit = (data: CreateRestaurantFormData) => {
    createRestaurantMutation.mutate(data);
  };

  const getSubscriptionStatus = (restaurant: Restaurant) => {
    if (!restaurant.subscriptionEndDate) return { status: 'expired', color: 'destructive' };
    
    const endDate = new Date(restaurant.subscriptionEndDate);
    const now = new Date();
    const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysLeft < 0) return { status: 'expired', color: 'destructive' };
    if (daysLeft <= 7) return { status: `${daysLeft}d left`, color: 'destructive' };
    if (daysLeft <= 30) return { status: `trial (${daysLeft}d)`, color: 'secondary' };
    return { status: 'active', color: 'default' };
  };

  if (statsLoading || restaurantsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Crown className="h-12 w-12 mx-auto mb-4 text-orange-600" />
          <p>Loading Super Admin Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <Crown className="h-8 w-8 text-orange-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Super Admin Dashboard</h1>
                <p className="text-sm text-gray-600">Manage all restaurants and monitor platform performance</p>
              </div>
            </div>
            
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-orange-600 hover:bg-orange-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Restaurant
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New Restaurant</DialogTitle>
                  <DialogDescription>
                    Add a new restaurant to the platform
                  </DialogDescription>
                </DialogHeader>
                
                <Form {...createForm}>
                  <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
                    <FormField
                      control={createForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Restaurant Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter restaurant name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={createForm.control}
                      name="slug"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>URL Slug</FormLabel>
                          <FormControl>
                            <Input placeholder="restaurant-name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={createForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="contact@restaurant.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={createForm.control}
                      name="tableCount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Number of Tables</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="10" 
                              {...field} 
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex justify-end space-x-2 pt-4">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsCreateDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        className="bg-orange-600 hover:bg-orange-700"
                        disabled={createRestaurantMutation.isPending}
                      >
                        {createRestaurantMutation.isPending ? "Creating..." : "Create Restaurant"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
                Today across all restaurants
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalOrders || 0}</div>
              <p className="text-xs text-muted-foreground">
                Orders placed today
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Trial Restaurants</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.trialRestaurants || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.expiredSubscriptions || 0} expired
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="restaurants" className="space-y-6">
          <TabsList>
            <TabsTrigger value="restaurants">Restaurants</TabsTrigger>
            <TabsTrigger value="orders">All Orders</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>
          
          <TabsContent value="restaurants">
            <Card>
              <CardHeader>
                <CardTitle>Restaurant Management</CardTitle>
                <CardDescription>
                  Manage all restaurants on the platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Restaurant</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Tables</TableHead>
                      <TableHead>Subscription</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {restaurants.map((restaurant: Restaurant) => {
                      const subscription = getSubscriptionStatus(restaurant);
                      return (
                        <TableRow key={restaurant.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{restaurant.name}</div>
                              <div className="text-sm text-muted-foreground">{restaurant.slug}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {restaurant.email && (
                                <div className="flex items-center text-sm">
                                  <Mail className="h-3 w-3 mr-1" />
                                  {restaurant.email}
                                </div>
                              )}
                              {restaurant.phone && (
                                <div className="flex items-center text-sm">
                                  <Phone className="h-3 w-3 mr-1" />
                                  {restaurant.phone}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{restaurant.tableCount}</TableCell>
                          <TableCell>
                            <Badge variant={subscription.color as any}>
                              {subscription.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={restaurant.isActive ? "default" : "secondary"}>
                              {restaurant.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              {restaurant.isActive ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleSubscriptionAction(restaurant.id, 'suspend')}
                                  disabled={subscriptionMutation.isPending}
                                >
                                  <Pause className="h-3 w-3" />
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleSubscriptionAction(restaurant.id, 'activate')}
                                  disabled={subscriptionMutation.isPending}
                                >
                                  <Play className="h-3 w-3" />
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleSubscriptionAction(restaurant.id, 'extend_trial')}
                                disabled={subscriptionMutation.isPending}
                              >
                                <Clock className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>All Orders</CardTitle>
                <CardDescription>
                  Monitor orders across all restaurants
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order #</TableHead>
                      <TableHead>Restaurant</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.slice(0, 50).map((order: any) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">{order.orderNumber}</TableCell>
                        <TableCell>{order.restaurantName || `Restaurant ${order.restaurantId}`}</TableCell>
                        <TableCell>{order.customerName || order.customerPhone || 'Guest'}</TableCell>
                        <TableCell>{formatCurrency(order.totalAmount)}</TableCell>
                        <TableCell>
                          <Badge variant={
                            order.status === 'completed' ? 'default' :
                            order.status === 'preparing' ? 'secondary' :
                            order.status === 'ready' ? 'default' : 'outline'
                          }>
                            {order.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(order.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>Restaurant Analytics</CardTitle>
                <CardDescription>
                  Performance metrics for all restaurants
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Restaurant</TableHead>
                      <TableHead>Orders Today</TableHead>
                      <TableHead>Revenue Today</TableHead>
                      <TableHead>Avg Order Value</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Activity</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analytics.map((data: any) => (
                      <TableRow key={data.restaurantId}>
                        <TableCell className="font-medium">{data.name}</TableCell>
                        <TableCell>{data.ordersToday}</TableCell>
                        <TableCell>{formatCurrency(data.revenueToday)}</TableCell>
                        <TableCell>{formatCurrency(data.avgOrderValue)}</TableCell>
                        <TableCell>
                          <Badge variant={data.subscriptionStatus === 'active' ? 'default' : 'secondary'}>
                            {data.subscriptionStatus}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(data.lastActivity)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
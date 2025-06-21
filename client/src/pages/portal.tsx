import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { 
  Building2, 
  Plus, 
  Eye, 
  Settings, 
  Users, 
  TrendingUp, 
  Calendar,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  Clock
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { insertRestaurantSchema, type Restaurant } from "@shared/schema";
import { z } from "zod";

const restaurantFormSchema = insertRestaurantSchema.extend({
  ownerName: z.string().min(2, "Owner name must be at least 2 characters"),
  ownerEmail: z.string().email("Invalid email address"),
  ownerPhone: z.string().min(10, "Phone number must be at least 10 digits"),
});

type RestaurantFormData = z.infer<typeof restaurantFormSchema>;

export default function RestaurantPortal() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { toast } = useToast();

  // Fetch all restaurants
  const { data: restaurants = [], isLoading } = useQuery<Restaurant[]>({
    queryKey: ["/api/restaurants"],
  });

  const form = useForm<RestaurantFormData>({
    resolver: zodResolver(restaurantFormSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      address: "",
      phone: "",
      email: "",
      ownerName: "",
      ownerEmail: "",
      ownerPhone: "",
      planType: "trial",
      isActive: true,
    },
  });

  // Create restaurant mutation
  const createRestaurantMutation = useMutation({
    mutationFn: async (data: RestaurantFormData) => {
      const response = await apiRequest("POST", "/api/restaurants", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/restaurants"] });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({
        title: "Restaurant created successfully!",
        description: "New restaurant has been added with 30-day free trial.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to create restaurant",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  // Toggle restaurant status
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const response = await apiRequest("PATCH", `/api/restaurants/${id}`, { isActive });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/restaurants"] });
      toast({
        title: "Restaurant status updated",
        description: "Status has been changed successfully.",
      });
    },
  });

  const onSubmit = (data: RestaurantFormData) => {
    // Generate slug from name
    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    createRestaurantMutation.mutate({ ...data, slug });
  };

  const getStatusBadge = (restaurant: Restaurant) => {
    if (!restaurant.isActive) {
      return <Badge variant="destructive">Suspended</Badge>;
    }
    
    const trialEndDate = new Date(restaurant.trialStartDate || new Date());
    trialEndDate.setDate(trialEndDate.getDate() + 30);
    const isTrialExpired = new Date() > trialEndDate && restaurant.planType === "trial";
    
    if (isTrialExpired) {
      return <Badge variant="destructive">Trial Expired</Badge>;
    }
    
    if (restaurant.planType === "premium") {
      return <Badge className="bg-purple-500 text-white">Premium</Badge>;
    }
    
    return <Badge className="bg-green-500 text-white">Free Trial</Badge>;
  };

  const getTrialDaysRemaining = (restaurant: Restaurant) => {
    if (restaurant.planType !== "trial") return null;
    
    const trialEndDate = new Date(restaurant.trialStartDate || new Date());
    trialEndDate.setDate(trialEndDate.getDate() + 30);
    const daysRemaining = Math.ceil((trialEndDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    
    return Math.max(0, daysRemaining);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-dark">Restaurant Management Portal</h1>
              <p className="text-muted-foreground">
                Manage all restaurant instances and subscriptions
              </p>
            </div>
            <Button onClick={() => setIsCreateDialogOpen(true)} className="gradient-primary">
              <Plus className="w-4 h-4 mr-2" />
              Add Restaurant
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <Building2 className="w-8 h-8 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Restaurants</p>
                  <p className="text-2xl font-bold">{restaurants.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-8 h-8 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Active</p>
                  <p className="text-2xl font-bold">
                    {restaurants.filter(r => r.isActive).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <CreditCard className="w-8 h-8 text-purple-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Premium</p>
                  <p className="text-2xl font-bold">
                    {restaurants.filter(r => r.planType === "premium").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <Clock className="w-8 h-8 text-orange-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Free Trials</p>
                  <p className="text-2xl font-bold">
                    {restaurants.filter(r => r.planType === "trial").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Restaurants Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {restaurants.map((restaurant) => {
            const trialDays = getTrialDaysRemaining(restaurant);
            
            return (
              <Card key={restaurant.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">{restaurant.name}</CardTitle>
                      <p className="text-sm text-muted-foreground truncate">
                        {restaurant.slug}.replit.app
                      </p>
                    </div>
                    {getStatusBadge(restaurant)}
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Restaurant Info */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Created:</span>
                      <span>{formatDate(restaurant.createdAt || new Date())}</span>
                    </div>
                    
                    {restaurant.planType === "trial" && trialDays !== null && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Trial ends in:</span>
                        <span className={trialDays <= 7 ? "text-red-600 font-medium" : ""}>
                          {trialDays} days
                        </span>
                      </div>
                    )}
                    
                    {restaurant.planType === "premium" && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Monthly rate:</span>
                        <span className="font-medium">
                          {formatCurrency(restaurant.monthlyRate || "4999")}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`https://${restaurant.slug}.replit.app`, '_blank')}
                      className="flex-1"
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      View
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`https://${restaurant.slug}.replit.app/admin`, '_blank')}
                      className="flex-1"
                    >
                      <Settings className="w-3 h-3 mr-1" />
                      Admin
                    </Button>
                    
                    <Button
                      variant={restaurant.isActive ? "destructive" : "default"}
                      size="sm"
                      onClick={() => toggleStatusMutation.mutate({
                        id: restaurant.id,
                        isActive: !restaurant.isActive
                      })}
                      disabled={toggleStatusMutation.isPending}
                    >
                      {restaurant.isActive ? "Suspend" : "Activate"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Create Restaurant Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Restaurant</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Restaurant Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Spice Palace" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Restaurant Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="restaurant@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Restaurant Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="+91 98765 43210" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input placeholder="123 Food Street, City" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input placeholder="Brief description of the restaurant" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-4">Owner Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="ownerName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Owner Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="ownerEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Owner Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="owner@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="ownerPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Owner Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="+91 98765 43210" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="gradient-primary"
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
  );
}
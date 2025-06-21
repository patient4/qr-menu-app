import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { 
  Star, 
  Plus, 
  Edit2, 
  Trash2, 
  Calendar,
  Clock,
  Tag,
  DollarSign
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { insertMenuItemSchema, type MenuItem } from "@shared/schema";
import { z } from "zod";

const specialFormSchema = insertMenuItemSchema.extend({
  isSpecial: z.boolean().default(true),
  specialEndDate: z.string().optional(),
  discountPercentage: z.string().optional(),
  specialNote: z.string().optional(),
});

type SpecialFormData = z.infer<typeof specialFormSchema>;

interface TodaysSpecialsProps {
  restaurantId: number;
}

export default function TodaysSpecials({ restaurantId }: TodaysSpecialsProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingSpecial, setEditingSpecial] = useState<MenuItem | null>(null);
  const { toast } = useToast();

  // Fetch today's specials
  const { data: specials = [], isLoading } = useQuery<MenuItem[]>({
    queryKey: ["/api/restaurant", restaurantId, "specials"],
    queryFn: async () => {
      const response = await fetch(`/api/restaurant/${restaurantId}/menu?special=true`);
      return response.json();
    },
  });

  const form = useForm<SpecialFormData>({
    resolver: zodResolver(specialFormSchema),
    defaultValues: {
      restaurantId,
      categoryId: 1,
      name: "",
      description: "",
      price: "",
      imageUrl: "",
      isVeg: true,
      isPopular: false,
      isAvailable: true,
      preparationTime: 15,
      isSpecial: true,
      specialEndDate: "",
      discountPercentage: "",
      specialNote: "",
    },
  });

  // Create special mutation
  const createSpecialMutation = useMutation({
    mutationFn: async (data: SpecialFormData) => {
      const response = await apiRequest("POST", "/api/menu-items", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/restaurant", restaurantId, "specials"] });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({
        title: "Special created successfully!",
        description: "Your special has been added to today's menu.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to create special",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update special mutation
  const updateSpecialMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<SpecialFormData> }) => {
      const response = await apiRequest("PATCH", `/api/menu-items/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/restaurant", restaurantId, "specials"] });
      setEditingSpecial(null);
      toast({
        title: "Special updated successfully!",
        description: "Changes have been saved.",
      });
    },
  });

  // Delete special mutation
  const deleteSpecialMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/menu-items/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/restaurant", restaurantId, "specials"] });
      toast({
        title: "Special removed",
        description: "The special has been removed from today's menu.",
      });
    },
  });

  const onSubmit = (data: SpecialFormData) => {
    if (editingSpecial) {
      updateSpecialMutation.mutate({ id: editingSpecial.id, data });
    } else {
      createSpecialMutation.mutate(data);
    }
  };

  const handleEditSpecial = (special: MenuItem) => {
    setEditingSpecial(special);
    form.reset({
      ...special,
      specialEndDate: "",
      discountPercentage: "",
      specialNote: "",
    });
    setIsCreateDialogOpen(true);
  };

  const isWeekend = () => {
    const today = new Date().getDay();
    return today === 0 || today === 6; // Sunday or Saturday
  };

  const getSpecialBadge = (special: MenuItem) => {
    if (isWeekend()) {
      return <Badge className="bg-purple-500 text-white">Weekend Special</Badge>;
    }
    return <Badge className="bg-orange-500 text-white">Today's Special</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-dark">Today's Specials</h2>
          <p className="text-muted-foreground">
            {isWeekend() ? "Weekend specials to attract more customers" : "Daily specials for today"}
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} className="gradient-primary">
          <Plus className="w-4 h-4 mr-2" />
          Add Special
        </Button>
      </div>

      {/* Weekend Banner */}
      {isWeekend() && (
        <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Star className="w-6 h-6 text-purple-500" />
              <div>
                <h3 className="font-semibold text-purple-700">Weekend Special Menu</h3>
                <p className="text-sm text-purple-600">
                  Perfect time to showcase premium dishes and attract weekend diners!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Specials Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-32 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded mb-4"></div>
                <div className="h-6 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : specials.length === 0 ? (
        <Card className="p-8 text-center">
          <Star className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No Specials Yet</h3>
          <p className="text-gray-500 mb-4">
            Create your first special to attract more customers
          </p>
          <Button onClick={() => setIsCreateDialogOpen(true)} className="gradient-primary">
            <Plus className="w-4 h-4 mr-2" />
            Add First Special
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {specials.map((special) => (
            <Card key={special.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              {special.imageUrl && (
                <div className="h-32 bg-gray-100 relative">
                  <img
                    src={special.imageUrl}
                    alt={special.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2">
                    {getSpecialBadge(special)}
                  </div>
                </div>
              )}
              
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-lg truncate">{special.name}</h3>
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditSpecial(special)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit2 className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteSpecialMutation.mutate(special.id)}
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                      disabled={deleteSpecialMutation.isPending}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                
                {special.description && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {special.description}
                  </p>
                )}
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-4 h-4 text-green-600" />
                    <span className="font-bold text-lg text-green-600">
                      {formatCurrency(special.price)}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>{special.preparationTime}m</span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 mt-3">
                  {special.isVeg && (
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      Veg
                    </Badge>
                  )}
                  {special.isPopular && (
                    <Badge className="bg-yellow-500 text-white">
                      Popular
                    </Badge>
                  )}
                  {!special.isAvailable && (
                    <Badge variant="destructive">
                      Unavailable
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Special Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingSpecial ? "Edit Special" : "Add New Special"}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Special Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Weekend Paneer Tikka" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price (₹)</FormLabel>
                      <FormControl>
                        <Input placeholder="299.00" {...field} />
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
                      <Textarea 
                        placeholder="Describe what makes this special..." 
                        {...field} 
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="preparationTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preparation Time (minutes)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="15" 
                          {...field}
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : "")}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="discountPercentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Discount % (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="10" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="specialNote"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Special Note (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Limited time offer, Chef's special, etc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsCreateDialogOpen(false);
                    setEditingSpecial(null);
                    form.reset();
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="gradient-primary"
                  disabled={createSpecialMutation.isPending || updateSpecialMutation.isPending}
                >
                  {createSpecialMutation.isPending || updateSpecialMutation.isPending
                    ? "Saving..." 
                    : editingSpecial 
                    ? "Update Special" 
                    : "Add Special"
                  }
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
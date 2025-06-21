import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Upload, Star, Eye, EyeOff } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { insertMenuItemSchema, type MenuItem, type MenuCategory } from "@shared/schema";
import { z } from "zod";

const productFormSchema = insertMenuItemSchema.extend({
  imageFile: z.any().optional(),
});

type ProductFormData = z.infer<typeof productFormSchema>;

interface ProductManagementProps {
  restaurantId: number;
}

export default function ProductManagement({ restaurantId }: ProductManagementProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<MenuItem | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const { toast } = useToast();

  // Fetch menu categories
  const { data: categories = [] } = useQuery<MenuCategory[]>({
    queryKey: [`/api/restaurant/${restaurantId}/categories`],
  });

  // Fetch menu items
  const { data: menuItems = [] } = useQuery<MenuItem[]>({
    queryKey: [`/api/restaurant/${restaurantId}/menu`],
  });

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    mode: "onSubmit", // Prevent validation on every change
    defaultValues: {
      restaurantId,
      name: "",
      description: "",
      price: "",
      categoryId: 0,
      isVeg: true,
      isPopular: false,
      isAvailable: true,
      preparationTime: 15,
      displayOrder: 0,
    },
  });

  // Create product mutation
  const createProductMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      console.log('Creating product with data:', data);
      const response = await fetch('/api/menu-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to create product:', response.status, errorText);
        throw new Error(`Failed to create product: ${response.status}`);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/restaurant/${restaurantId}/menu`] });
      setIsAddDialogOpen(false);
      form.reset();
      setImagePreview("");
      toast({
        title: "Product added successfully!",
        description: "The new menu item has been created.",
      });
    },
    onError: (error: any) => {
      console.error('Product creation error:', error);
      toast({
        title: "Failed to add product",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update product mutation
  const updateProductMutation = useMutation({
    mutationFn: async (data: ProductFormData & { id: number }) => {
      const response = await fetch(`/api/menu-items/${data.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to update product');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/restaurant/${restaurantId}/menu`] });
      setIsEditDialogOpen(false);
      setSelectedProduct(null);
      form.reset();
      setImagePreview("");
      toast({
        title: "Product updated successfully!",
        description: "The menu item has been updated.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to update product",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/menu-items/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/restaurant/${restaurantId}/menu`] });
      toast({
        title: "Product deleted successfully!",
        description: "The menu item has been removed.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to delete product",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Only show preview, don't include large base64 in form data
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      // For now, just use a placeholder URL - image upload can be implemented separately
      form.setValue("imageUrl", `https://images.unsplash.com/photo-1546833999-b9f581a1996d?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200`);
    }
  };

  const handleEditProduct = (product: MenuItem) => {
    setSelectedProduct(product);
    form.reset({
      restaurantId: product.restaurantId,
      categoryId: product.categoryId,
      name: product.name,
      description: product.description || "",
      price: product.price,
      isVeg: product.isVeg,
      isPopular: product.isPopular,
      isAvailable: product.isAvailable,
      preparationTime: product.preparationTime || 15,
      displayOrder: product.displayOrder,
    });
    setImagePreview(product.imageUrl || "");
    setIsEditDialogOpen(true);
  };

  const onSubmit = (data: ProductFormData) => {
    // Remove imageFile from data to prevent payload issues
    const { imageFile, ...submitData } = data;
    
    if (selectedProduct) {
      updateProductMutation.mutate({ ...submitData, id: selectedProduct.id });
    } else {
      createProductMutation.mutate(submitData);
    }
  };

  const resetForm = () => {
    form.reset({
      restaurantId,
      name: "",
      description: "",
      price: "",
      categoryId: 0,
      isVeg: true,
      isPopular: false,
      isAvailable: true,
      preparationTime: 15,
      displayOrder: 0,
    });
    setImagePreview("");
    setSelectedProduct(null);
  };

  const ProductDialog = ({ isOpen, onOpenChange, title }: { isOpen: boolean; onOpenChange: (open: boolean) => void; title: string }) => {
    const handleDialogClose = (open: boolean) => {
      if (!open) {
        resetForm();
      }
      onOpenChange(open);
    };

    return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Product Image */}
              <div className="space-y-4">
                <Label>Product Image</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  {imagePreview ? (
                    <div className="space-y-2">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-48 object-cover rounded-lg mx-auto"
                      />
                      <Button type="button" variant="outline" size="sm" onClick={() => setImagePreview("")}>
                        Remove Image
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                      <p className="text-gray-500">Upload product image</p>
                    </div>
                  )}
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="mt-2"
                  />
                </div>
              </div>

              {/* Product Details */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter product name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value))} 
                        value={field.value > 0 ? field.value.toString() : ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id.toString()}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                        <Input type="number" step="0.01" placeholder="0.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                          value={field.value?.toString() || ""}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter product description" 
                      rows={3} 
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="isVeg"
                render={({ field }) => (
                  <FormItem className="flex items-center space-y-0 space-x-2">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="rounded"
                      />
                    </FormControl>
                    <FormLabel>Vegetarian</FormLabel>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isPopular"
                render={({ field }) => (
                  <FormItem className="flex items-center space-y-0 space-x-2">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="rounded"
                      />
                    </FormControl>
                    <FormLabel>Popular Item</FormLabel>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isAvailable"
                render={({ field }) => (
                  <FormItem className="flex items-center space-y-0 space-x-2">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="rounded"
                      />
                    </FormControl>
                    <FormLabel>Available</FormLabel>
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="gradient-primary"
                disabled={createProductMutation.isPending || updateProductMutation.isPending}
              >
                {createProductMutation.isPending || updateProductMutation.isPending ? "Saving..." : selectedProduct ? "Update Product" : "Add Product"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-dark">Product Management</h2>
        <Button
          onClick={() => {
            resetForm();
            setIsAddDialogOpen(true);
          }}
          className="gradient-primary"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Product
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {menuItems.map((item) => (
          <Card key={item.id} className="overflow-hidden">
            <div className="relative">
              <img
                src={item.imageUrl || "https://images.unsplash.com/photo-1546833999-b9f581a1996d?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200"}
                alt={item.name}
                className="w-full h-48 object-cover"
              />
              <div className="absolute top-2 right-2 flex space-x-1">
                {item.isPopular && (
                  <Badge className="bg-accent text-accent-foreground">
                    <Star className="w-3 h-3 mr-1" />
                    Popular
                  </Badge>
                )}
                {!item.isAvailable && (
                  <Badge variant="secondary">
                    <EyeOff className="w-3 h-3 mr-1" />
                    Unavailable
                  </Badge>
                )}
              </div>
            </div>
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-lg">{item.name}</h3>
                <div className="flex items-center">
                  <span className="text-green-600 text-xs mr-1">●</span>
                  <span className="text-xs text-muted-foreground">
                    {item.isVeg ? "Veg" : "Non-Veg"}
                  </span>
                </div>
              </div>
              <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                {item.description}
              </p>
              <div className="flex justify-between items-center mb-3">
                <span className="font-bold text-primary text-lg">
                  {formatCurrency(item.price)}
                </span>
                <span className="text-sm text-muted-foreground">
                  {item.preparationTime}min prep
                </span>
              </div>
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEditProduct(item)}
                  className="flex-1"
                  data-testid="edit-product"
                >
                  <Edit className="w-3 h-3 mr-1" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => deleteProductMutation.mutate(item.id)}
                  disabled={deleteProductMutation.isPending}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Product Dialog */}
      <ProductDialog
        isOpen={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        title="Add New Product"
      />

      {/* Edit Product Dialog */}
      <ProductDialog
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        title="Edit Product"
      />
    </div>
  );
}
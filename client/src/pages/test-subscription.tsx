import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function TestSubscription() {
  const { toast } = useToast();

  // Fetch restaurant info
  const { data: restaurant, isLoading } = useQuery({
    queryKey: ['/api/restaurant/1'],
    refetchInterval: 5000,
  });

  // Expire trial mutation
  const expireTrialMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("PATCH", "/api/super-admin/restaurants/1/subscription", { 
        action: "expire_trial" 
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/restaurant/1'] });
      toast({
        title: "Trial Expired",
        description: "Restaurant trial has been expired for testing.",
        variant: "destructive",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to expire trial.",
        variant: "destructive",
      });
    },
  });

  // Activate restaurant mutation
  const activateMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("PATCH", "/api/super-admin/restaurants/1/subscription", { 
        action: "activate" 
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/restaurant/1'] });
      toast({
        title: "Restaurant Activated",
        description: "Restaurant subscription has been activated.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to activate restaurant.",
        variant: "destructive",
      });
    },
  });

  // Suspend restaurant mutation
  const suspendMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("PATCH", "/api/super-admin/restaurants/1/subscription", { 
        action: "suspend" 
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/restaurant/1'] });
      toast({
        title: "Restaurant Suspended",
        description: "Restaurant has been suspended for testing.",
        variant: "destructive",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to suspend restaurant.",
        variant: "destructive",
      });
    },
  });

  const getSubscriptionStatus = () => {
    if (!restaurant) return { status: 'loading', color: 'secondary' };
    
    if (!restaurant.isActive) {
      return { status: 'suspended/expired', color: 'destructive' };
    }

    if (restaurant.subscriptionEndDate) {
      const endDate = new Date(restaurant.subscriptionEndDate);
      const now = new Date();
      const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysLeft < 0) return { status: 'expired', color: 'destructive' };
      if (daysLeft <= 7) return { status: `${daysLeft} days left`, color: 'destructive' };
      if (daysLeft <= 30) return { status: `trial (${daysLeft}d)`, color: 'secondary' };
      return { status: 'active', color: 'default' };
    }

    return { status: 'unknown', color: 'secondary' };
  };

  const subscriptionStatus = getSubscriptionStatus();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Subscription Testing
          </h1>
          <p className="text-gray-600">
            Test restaurant access controls and subscription restrictions
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Restaurant Status
              <Badge variant={subscriptionStatus.color as any}>
                {subscriptionStatus.status}
              </Badge>
            </CardTitle>
            <CardDescription>
              Current subscription and access status for {restaurant?.name}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Plan Type:</span>
                <span className="ml-2">{restaurant?.planType || 'Unknown'}</span>
              </div>
              <div>
                <span className="font-medium">Active:</span>
                <span className="ml-2">{restaurant?.isActive ? 'Yes' : 'No'}</span>
              </div>
              <div>
                <span className="font-medium">End Date:</span>
                <span className="ml-2">
                  {restaurant?.subscriptionEndDate 
                    ? new Date(restaurant.subscriptionEndDate).toLocaleDateString()
                    : 'Not set'
                  }
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Test Actions</CardTitle>
            <CardDescription>
              Use these buttons to test different subscription states
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <Button
                variant="destructive"
                onClick={() => expireTrialMutation.mutate()}
                disabled={expireTrialMutation.isPending}
                className="justify-start"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Expire Trial (Disable Access)
              </Button>
              
              <Button
                variant="outline"
                onClick={() => suspendMutation.mutate()}
                disabled={suspendMutation.isPending}
                className="justify-start"
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                Suspend Restaurant
              </Button>
              
              <Button
                variant="default"
                onClick={() => activateMutation.mutate()}
                disabled={activateMutation.isPending}
                className="justify-start"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Activate Restaurant
              </Button>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">How to Test:</h4>
              <ol className="text-sm text-blue-800 space-y-1">
                <li>1. Click "Expire Trial" to disable restaurant access</li>
                <li>2. Try accessing /admin or /customer - should show restrictions</li>
                <li>3. Menu loading and ordering should be blocked</li>
                <li>4. Click "Activate Restaurant" to restore access</li>
              </ol>
            </div>

            <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
              <h4 className="font-medium text-yellow-900 mb-2">Test URLs:</h4>
              <div className="text-sm text-yellow-800 space-y-1">
                <div>Admin Panel: <code>/admin</code></div>
                <div>Customer Menu: <code>/customer</code></div>
                <div>Super Admin: <code>/super-admin</code></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
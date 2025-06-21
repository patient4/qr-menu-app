import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Crown, Calendar, CreditCard, AlertTriangle, CheckCircle } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Restaurant } from "@shared/schema";

interface SubscriptionManagementProps {
  restaurant: Restaurant;
}

export default function SubscriptionManagement({ restaurant }: SubscriptionManagementProps) {
  const [isUpgradeDialogOpen, setIsUpgradeDialogOpen] = useState(false);
  const { toast } = useToast();

  // Calculate trial days remaining
  const trialStartDate = new Date(restaurant.trialStartDate || new Date());
  const trialEndDate = new Date(trialStartDate.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
  const currentDate = new Date();
  const daysRemaining = Math.max(0, Math.ceil((trialEndDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)));
  const trialProgress = Math.max(0, Math.min(100, ((30 - daysRemaining) / 30) * 100));

  const isTrialExpired = daysRemaining <= 0 && restaurant.planType === "trial";
  const isTrialExpiringSoon = daysRemaining <= 7 && restaurant.planType === "trial";

  // Upgrade to premium mutation
  const upgradeMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/restaurant/${restaurant.id}/upgrade`, {
        planType: "premium"
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/restaurant/${restaurant.id}`] });
      setIsUpgradeDialogOpen(false);
      toast({
        title: "Subscription upgraded successfully!",
        description: "Your restaurant is now on the Premium plan.",
      });
    },
    onError: () => {
      toast({
        title: "Upgrade failed",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = () => {
    if (restaurant.planType === "premium") {
      return <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">Premium</Badge>;
    }
    if (isTrialExpired) {
      return <Badge variant="destructive">Trial Expired</Badge>;
    }
    if (isTrialExpiringSoon) {
      return <Badge className="bg-yellow-500 text-white">Trial Expiring</Badge>;
    }
    return <Badge className="bg-green-500 text-white">Free Trial</Badge>;
  };

  const getStatusIcon = () => {
    if (restaurant.planType === "premium") {
      return <Crown className="w-5 h-5 text-purple-500" />;
    }
    if (isTrialExpired) {
      return <AlertTriangle className="w-5 h-5 text-red-500" />;
    }
    return <CheckCircle className="w-5 h-5 text-green-500" />;
  };

  return (
    <div className="space-y-6">
      {/* Main Subscription Card */}
      <Card className={`${restaurant.planType === "premium" ? "bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200" : isTrialExpired ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getStatusIcon()}
              <div>
                <CardTitle className="text-xl font-bold">Subscription Status</CardTitle>
                <p className="text-muted-foreground">
                  {restaurant.planType === "premium" ? "Premium Plan" : "Free Trial"}
                </p>
              </div>
            </div>
            {getStatusBadge()}
          </div>
        </CardHeader>
        <CardContent>
          {restaurant.planType === "trial" && (
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Trial Progress</span>
                  <span className="text-sm text-muted-foreground">
                    {daysRemaining} days remaining
                  </span>
                </div>
                <Progress value={trialProgress} className="h-2" />
              </div>
              
              {isTrialExpired ? (
                <div className="bg-red-100 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 text-red-700 mb-2">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="font-semibold">Trial Expired</span>
                  </div>
                  <p className="text-sm text-red-600 mb-3">
                    Your free trial has ended. Upgrade to Premium to continue using all features.
                  </p>
                  <Button 
                    onClick={() => setIsUpgradeDialogOpen(true)}
                    className="bg-red-600 hover:bg-red-700 text-white"
                    size="sm"
                  >
                    Upgrade Now
                  </Button>
                </div>
              ) : isTrialExpiringSoon ? (
                <div className="bg-yellow-100 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 text-yellow-700 mb-2">
                    <Calendar className="w-4 h-4" />
                    <span className="font-semibold">Trial Expiring Soon</span>
                  </div>
                  <p className="text-sm text-yellow-600 mb-3">
                    Your free trial expires in {daysRemaining} days. Upgrade to avoid service interruption.
                  </p>
                  <Button 
                    onClick={() => setIsUpgradeDialogOpen(true)}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white"
                    size="sm"
                  >
                    Upgrade to Premium
                  </Button>
                </div>
              ) : (
                <div className="bg-green-100 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 text-green-700 mb-2">
                    <CheckCircle className="w-4 h-4" />
                    <span className="font-semibold">Trial Active</span>
                  </div>
                  <p className="text-sm text-green-600 mb-3">
                    Enjoy all Premium features during your 30-day free trial.
                  </p>
                  <Button 
                    onClick={() => setIsUpgradeDialogOpen(true)}
                    variant="outline"
                    className="border-green-300 text-green-700 hover:bg-green-50"
                    size="sm"
                  >
                    Upgrade Early & Save
                  </Button>
                </div>
              )}
            </div>
          )}

          {restaurant.planType === "premium" && (
            <div className="bg-purple-100 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 text-purple-700 mb-2">
                <Crown className="w-4 h-4" />
                <span className="font-semibold">Premium Active</span>
              </div>
              <p className="text-sm text-purple-600 mb-2">
                You're enjoying all Premium features with unlimited access.
              </p>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">
                  Monthly Rate: {formatCurrency(restaurant.monthlyRate || "4999")}
                </span>
                {restaurant.subscriptionEndDate && (
                  <span className="text-sm text-muted-foreground">
                    Next billing: {formatDate(restaurant.subscriptionEndDate)}
                  </span>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Feature Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Plan Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Free Trial */}
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="font-semibold text-lg">Free Trial</h3>
                <p className="text-2xl font-bold text-green-600">₹0</p>
                <p className="text-sm text-muted-foreground">30 days free</p>
              </div>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Up to 50 orders per day</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Basic menu management</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>QR code ordering</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Real-time order tracking</span>
                </li>
              </ul>
            </div>

            {/* Premium */}
            <div className="space-y-4 relative">
              {restaurant.planType !== "premium" && (
                <div className="absolute top-0 right-0 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-2 py-1 rounded-bl-lg">
                  Recommended
                </div>
              )}
              <div className="text-center">
                <h3 className="font-semibold text-lg">Premium</h3>
                <p className="text-2xl font-bold text-purple-600">₹4,999</p>
                <p className="text-sm text-muted-foreground">per month</p>
              </div>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Unlimited orders</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Advanced analytics & reports</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Custom branding & themes</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Priority customer support</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Multi-location management</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Integration with POS systems</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upgrade Dialog */}
      <Dialog open={isUpgradeDialogOpen} onOpenChange={setIsUpgradeDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Crown className="w-5 h-5 text-purple-500" />
              <span>Upgrade to Premium</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-purple-600">₹4,999</p>
              <p className="text-sm text-muted-foreground">per month</p>
            </div>
            
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <p className="text-sm text-purple-700">
                ✨ Get unlimited orders, advanced analytics, and priority support with our Premium plan.
              </p>
            </div>

            <div className="space-y-3">
              <Button 
                onClick={() => upgradeMutation.mutate()}
                disabled={upgradeMutation.isPending}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                {upgradeMutation.isPending ? "Processing..." : "Upgrade Now"}
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => setIsUpgradeDialogOpen(false)}
                className="w-full"
              >
                Maybe Later
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
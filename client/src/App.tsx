import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import CustomerApp from "@/pages/customer";
import AdminApp from "@/pages/admin";
import RestaurantPortal from "@/pages/portal";
import SuperAdminApp from "@/pages/super-admin";
import TestSubscription from "@/pages/test-subscription";
import LoginPage from "@/pages/login";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={LoginPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/admin" component={AdminApp} />
      <Route path="/customer" component={CustomerApp} />
      <Route path="/portal" component={RestaurantPortal} />
      <Route path="/super-admin" component={SuperAdminApp} />
      <Route path="/test-subscription" component={TestSubscription} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

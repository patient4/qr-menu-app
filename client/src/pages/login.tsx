import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AuthLogin from "@/components/AuthLogin";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const [userType, setUserType] = useState<"CUSTOMER" | "ADMIN">("CUSTOMER");

  // Check if user is already logged in
  useEffect(() => {
    const storedUser = localStorage.getItem("authUser");
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        if (user.role === "ADMIN") {
          setLocation("/admin");
        } else {
          setLocation("/customer");
        }
      } catch (error) {
        localStorage.removeItem("authUser");
      }
    }
  }, [setLocation]);

  const handleLogin = (user: any) => {
    // Redirect based on user role
    if (user.role === "ADMIN") {
      setLocation("/admin");
    } else {
      setLocation("/customer");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-orange-600 mb-2">
            🌶️ Icy Spicy Tadka
          </h1>
          <p className="text-gray-600">Pure Vegetarian Restaurant</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Welcome Back</CardTitle>
            <CardDescription>
              Sign in with your phone number to continue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={userType} onValueChange={(value) => setUserType(value as "CUSTOMER" | "ADMIN")}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="CUSTOMER">Customer</TabsTrigger>
                <TabsTrigger value="ADMIN">Admin</TabsTrigger>
              </TabsList>
              
              <TabsContent value="CUSTOMER" className="space-y-4">
                <div className="text-center text-sm text-gray-600 mb-4">
                  <p>Browse our delicious menu and place orders</p>
                </div>
                <AuthLogin onLogin={handleLogin} userType="CUSTOMER" />
              </TabsContent>
              
              <TabsContent value="ADMIN" className="space-y-4">
                <div className="text-center text-sm text-gray-600 mb-4">
                  <p>Manage orders and restaurant operations</p>
                </div>
                <AuthLogin onLogin={handleLogin} userType="ADMIN" />
              </TabsContent>
            </Tabs>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                New to Icy Spicy Tadka? Your account will be created automatically
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <Link href="/customer" className="text-sm text-orange-600 hover:underline">
            Continue as Guest
          </Link>
        </div>
      </div>
    </div>
  );
}
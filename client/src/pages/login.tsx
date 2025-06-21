import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import AuthForm from "@/components/AuthForm";

export default function LoginPage() {
  const [, setLocation] = useLocation();

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
          <div className="mt-4 text-sm text-gray-500">
            <p>Everyone can login with username and password.</p>
            <p>Admin users will see admin features automatically.</p>
          </div>
        </div>

        <AuthForm onLogin={handleLogin} />

        <div className="mt-6 text-center">
          <Link href="/customer" className="text-sm text-orange-600 hover:underline">
            Continue as Guest
          </Link>
        </div>
      </div>
    </div>
  );
}
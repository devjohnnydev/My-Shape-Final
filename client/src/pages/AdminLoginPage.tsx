import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem("adminToken", data.token);
        toast({
          title: "Success",
          description: "Admin login successful",
        });
        setLocation("/admin/dashboard");
      } else {
        toast({
          title: "Error",
          description: "Invalid admin credentials",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Login failed",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <Card className="w-full max-w-md p-8">
        <h1 className="text-2xl font-bold mb-6 text-center">Admin Login</h1>
        
        <form onSubmit={handleAdminLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              data-testid="input-admin-email"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              data-testid="input-admin-password"
              required
            />
          </div>

          <Button 
            type="submit" 
            className="w-full"
            disabled={isLoading}
            data-testid="button-admin-login"
          >
            {isLoading ? "Logging in..." : "Admin Login"}
          </Button>
        </form>

        <div className="mt-4 text-center">
          <a href="/login" className="text-blue-600 hover:underline text-sm">
            Back to User Login
          </a>
        </div>
      </Card>
    </div>
  );
}

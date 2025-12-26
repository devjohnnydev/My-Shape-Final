import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

import NotFound from "@/pages/not-found";
import LandingPage from "@/pages/LandingPage";
import HomePage from "@/pages/HomePage";
import WorkoutsPage from "@/pages/WorkoutsPage";
import ProfilePage from "@/pages/ProfilePage";
import SettingsPage from "@/pages/SettingsPage";
import QAPage from "@/pages/QAPage";
import AdminPage from "@/pages/AdminPage";
import AdminDashboard from "@/pages/AdminDashboard";
import PendingApprovalPage from "@/pages/PendingApprovalPage";
import AdminLoginPage from "@/pages/AdminLoginPage";
import RegisterPage from "@/pages/RegisterPage";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <LandingPage />;
  }

  if (user.approvalStatus === "pending") {
    return <PendingApprovalPage />;
  }

  if (user.approvalStatus === "rejected" || user.approvalStatus === "blocked") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p>Your account has been denied access.</p>
        </div>
      </div>
    );
  }

  return <Component />;
}

function Router() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/">
        {user ? <HomePage /> : <LandingPage />}
      </Route>
      
      <Route path="/register">
        <RegisterPage />
      </Route>

      <Route path="/workouts">
        {() => <ProtectedRoute component={WorkoutsPage} />}
      </Route>
      
      <Route path="/profile">
        {() => <ProtectedRoute component={ProfilePage} />}
      </Route>
      
      <Route path="/settings">
        {() => <ProtectedRoute component={SettingsPage} />}
      </Route>

      <Route path="/qa">
        {() => <ProtectedRoute component={QAPage} />}
      </Route>

      <Route path="/admin-login">
        <AdminLoginPage />
      </Route>

      <Route path="/admin">
        {() => <ProtectedRoute component={AdminPage} />}
      </Route>
      
      <Route path="/admin/dashboard">
        <AdminDashboard />
      </Route>

      <Route path="/pending-approval">
        <PendingApprovalPage />
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;

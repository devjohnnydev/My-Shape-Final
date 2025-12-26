import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GymManagement } from "@/components/admin/GymManagement";
import { UserManagement } from "@/components/admin/UserManagement";
import { DashboardStats } from "@/components/admin/DashboardStats";

interface DashboardStats {
  totalUsers: number;
  totalGyms: number;
  totalPending: number;
  totalApproved: number;
  totalAccessTotal: number;
  totalAccessPartial: number;
}

export default function AdminDashboardPageComponent() {
  const [activeTab, setActiveTab] = useState("stats");

  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ["/api/admin/dashboard/stats"],
  });

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <Button variant="outline" onClick={() => window.location.href = "/auth/logout"}>
          Logout
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="stats" data-testid="tab-stats">Statistics</TabsTrigger>
          <TabsTrigger value="gyms" data-testid="tab-gyms">Gyms</TabsTrigger>
          <TabsTrigger value="users" data-testid="tab-users">Users</TabsTrigger>
        </TabsList>

        <TabsContent value="stats" className="space-y-4">
          <DashboardStats stats={stats} />
        </TabsContent>

        <TabsContent value="gyms" className="space-y-4">
          <GymManagement />
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <UserManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}

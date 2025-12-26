import { Card } from "@/components/ui/card";

interface DashboardStatsProps {
  stats?: {
    totalUsers: number;
    totalGyms: number;
    totalPending: number;
    totalApproved: number;
    totalAccessTotal: number;
    totalAccessPartial: number;
  };
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  const statItems = [
    { label: "Total Users", value: stats?.totalUsers || 0, color: "bg-blue-500" },
    { label: "Total Gyms", value: stats?.totalGyms || 0, color: "bg-green-500" },
    { label: "Pending Approvals", value: stats?.totalPending || 0, color: "bg-yellow-500" },
    { label: "Approved Users", value: stats?.totalApproved || 0, color: "bg-emerald-500" },
    { label: "Full Access", value: stats?.totalAccessTotal || 0, color: "bg-purple-500" },
    { label: "Partial Access", value: stats?.totalAccessPartial || 0, color: "bg-orange-500" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {statItems.map((item) => (
        <Card key={item.label} className="p-6">
          <div className="space-y-2">
            <p className="text-sm text-slate-600 dark:text-slate-400">{item.label}</p>
            <p className="text-3xl font-bold" data-testid={`stat-${item.label.toLowerCase().replace(/\s/g, '-')}`}>
              {item.value}
            </p>
            <div className={`h-1 w-full rounded-full ${item.color}`}></div>
          </div>
        </Card>
      ))}
    </div>
  );
}

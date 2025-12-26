import { useEffect } from "react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";

interface User {
  id: string;
  email: string;
  approvalStatus: string;
}

export default function PendingApprovalPage() {
  const [, setLocation] = useLocation();

  const { data: user } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    retry: 1,
  });

  useEffect(() => {
    if (user?.approvalStatus === "approved") {
      setLocation("/");
    } else if (user?.approvalStatus === "rejected" || user?.approvalStatus === "blocked") {
      setLocation("/auth/denied");
    }
  }, [user?.approvalStatus, setLocation]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <Card className="w-full max-w-md p-8 text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Approval Pending</h1>
          <p className="text-slate-600 dark:text-slate-400">
            Seu cadastro está em análise pelo administrador.
          </p>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Por favor, aguarde a aprovação. Você será notificado quando seu acesso for liberado.
          </p>
        </div>

        <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
          <p>Status: <span className="font-semibold text-yellow-600 dark:text-yellow-400">Pendente</span></p>
          {user?.email && <p>Email: {user.email}</p>}
        </div>

        <Button 
          variant="outline" 
          onClick={() => window.location.reload()}
          data-testid="button-refresh-status"
        >
          Refresh Status
        </Button>
      </Card>
    </div>
  );
}

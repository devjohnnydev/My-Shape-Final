import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Plus, Check, X, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Gym {
  id: number;
  name: string;
  primaryColor: string;
  secondaryColor: string;
}

interface UserApproval {
  id: number;
  userId: string;
  status: string;
  gymId?: number;
  requestedAt: string;
}

export default function AdminDashboard() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showGymForm, setShowGymForm] = useState(false);
  const [newGym, setNewGym] = useState({ name: '', primaryColor: '#000000', secondaryColor: '#FFFFFF' });

  const { data: gyms = [] } = useQuery<Gym[]>({
    queryKey: ["/api/admin/gyms"],
    queryFn: async () => {
      const res = await fetch("/api/admin/gyms", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const { data: approvals = [] } = useQuery<UserApproval[]>({
    queryKey: ["/api/admin/approvals"],
    queryFn: async () => {
      const res = await fetch("/api/admin/approvals", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const addGymMutation = useMutation({
    mutationFn: async (gym: typeof newGym) => {
      const res = await fetch("/api/admin/gyms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(gym),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create gym");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/gyms"] });
      setNewGym({ name: '', primaryColor: '#000000', secondaryColor: '#FFFFFF' });
      setShowGymForm(false);
      toast({ title: "Academia criada com sucesso!", variant: "default" });
    },
  });

  const approveMutation = useMutation({
    mutationFn: async ({ userId, gymId }: { userId: string; gymId: number }) => {
      const res = await fetch(`/api/admin/approvals/${userId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gymId }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to approve");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/approvals"] });
      toast({ title: "Usuário aprovado!", variant: "default" });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch(`/api/admin/approvals/${userId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Rejeitado pelo admin" }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to reject");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/approvals"] });
      toast({ title: "Usuário rejeitado!", variant: "default" });
    },
  });

  const pendingApprovals = approvals.filter(a => a.status === 'pending');
  const approvedUsers = approvals.filter(a => a.status === 'approved');

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-2">Painel de Administração</h1>
        <p className="text-muted-foreground">Gerencie academias e aprove usuários</p>
      </div>

      {/* Gyms Section */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Academias</h2>
          <Button onClick={() => setShowGymForm(!showGymForm)}>
            <Plus className="mr-2 h-4 w-4" /> Nova Academia
          </Button>
        </div>

        {showGymForm && (
          <Card className="p-4 mb-4">
            <div className="space-y-4">
              <Input
                placeholder="Nome da Academia"
                value={newGym.name}
                onChange={(e) => setNewGym({ ...newGym, name: e.target.value })}
                data-testid="input-gym-name"
              />
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-sm font-medium">Cor Principal</label>
                  <input
                    type="color"
                    value={newGym.primaryColor}
                    onChange={(e) => setNewGym({ ...newGym, primaryColor: e.target.value })}
                    className="w-full h-10 rounded cursor-pointer"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-sm font-medium">Cor Secundária</label>
                  <input
                    type="color"
                    value={newGym.secondaryColor}
                    onChange={(e) => setNewGym({ ...newGym, secondaryColor: e.target.value })}
                    className="w-full h-10 rounded cursor-pointer"
                  />
                </div>
              </div>
              <Button 
                onClick={() => addGymMutation.mutate(newGym)} 
                disabled={!newGym.name || addGymMutation.isPending}
                className="w-full"
                data-testid="button-save-gym"
              >
                {addGymMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
              </Button>
            </div>
          </Card>
        )}

        <div className="grid gap-3 md:grid-cols-2">
          {gyms.map((gym) => (
            <Card key={gym.id} className="p-4">
              <h3 className="font-bold mb-3">{gym.name}</h3>
              <div className="flex gap-3">
                <div className="w-12 h-12 rounded" style={{ backgroundColor: gym.primaryColor }}></div>
                <div className="w-12 h-12 rounded" style={{ backgroundColor: gym.secondaryColor }}></div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* User Approvals Section */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Aprovações de Usuários</h2>

        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-3 text-yellow-600">Pendentes ({pendingApprovals.length})</h3>
            {pendingApprovals.length === 0 ? (
              <p className="text-muted-foreground">Nenhuma solicitação pendente</p>
            ) : (
              <div className="space-y-3">
                {pendingApprovals.map((approval) => (
                  <Card key={approval.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{approval.userId}</p>
                        <p className="text-sm text-muted-foreground">
                          Solicitado em: {new Date(approval.requestedAt).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => approveMutation.mutate({ userId: approval.userId, gymId: approval.gymId || 1 })}
                          disabled={approveMutation.isPending}
                          className="bg-green-600 hover:bg-green-700"
                          data-testid={`button-approve-${approval.userId}`}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => rejectMutation.mutate(approval.userId)}
                          disabled={rejectMutation.isPending}
                          data-testid={`button-reject-${approval.userId}`}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3 text-green-600">Aprovados ({approvedUsers.length})</h3>
            {approvedUsers.length === 0 ? (
              <p className="text-muted-foreground">Nenhum usuário aprovado</p>
            ) : (
              <div className="space-y-3">
                {approvedUsers.map((approval) => (
                  <Card key={approval.id} className="p-4 bg-green-50 dark:bg-green-950">
                    <p className="font-medium">{approval.userId}</p>
                    <p className="text-sm text-muted-foreground">
                      Aprovado em: {approval.approvedAt ? new Date(approval.approvedAt).toLocaleDateString('pt-BR') : '-'}
                    </p>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

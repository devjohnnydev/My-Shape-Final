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
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to reject");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/approvals"] });
      toast({ title: "Usuário rejeitado", variant: "default" });
    },
  });

  const pendingUsers = approvals.filter(a => a.status === 'pending');
  const approvedUsers = approvals.filter(a => a.status === 'approved');

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <Button variant="outline" onClick={() => window.location.href = '/auth/logout'} data-testid="button-logout">
          Logout
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <p className="text-sm text-muted-foreground">Academias</p>
          <p className="text-3xl font-bold" data-testid="stat-gyms">{gyms.length}</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground">Aprovações Pendentes</p>
          <p className="text-3xl font-bold" data-testid="stat-pending">{pendingUsers.length}</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground">Usuários Aprovados</p>
          <p className="text-3xl font-bold" data-testid="stat-approved">{approvedUsers.length}</p>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Academias</h2>
        {!showGymForm ? (
          <Button onClick={() => setShowGymForm(true)} data-testid="button-add-gym">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Academia
          </Button>
        ) : (
          <Card className="p-6 space-y-4">
            <h3 className="font-semibold">Nova Academia</h3>
            <Input
              placeholder="Nome da Academia"
              value={newGym.name}
              onChange={(e) => setNewGym({ ...newGym, name: e.target.value })}
              data-testid="input-gym-name"
            />
            <div className="flex gap-4">
              <div>
                <label className="block text-sm mb-2">Cor Primária</label>
                <input
                  type="color"
                  value={newGym.primaryColor}
                  onChange={(e) => setNewGym({ ...newGym, primaryColor: e.target.value })}
                  data-testid="input-primary-color"
                />
              </div>
              <div>
                <label className="block text-sm mb-2">Cor Secundária</label>
                <input
                  type="color"
                  value={newGym.secondaryColor}
                  onChange={(e) => setNewGym({ ...newGym, secondaryColor: e.target.value })}
                  data-testid="input-secondary-color"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => addGymMutation.mutate(newGym)}
                disabled={addGymMutation.isPending || !newGym.name}
                data-testid="button-save-gym"
              >
                Salvar
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowGymForm(false)}
                data-testid="button-cancel"
              >
                Cancelar
              </Button>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {gyms.map(gym => (
            <Card key={gym.id} className="p-4" data-testid={`gym-card-${gym.id}`}>
              <h3 className="font-semibold">{gym.name}</h3>
              <div className="flex gap-2 mt-3">
                <div
                  className="w-10 h-10 rounded border"
                  style={{ backgroundColor: gym.primaryColor }}
                />
                <div
                  className="w-10 h-10 rounded border"
                  style={{ backgroundColor: gym.secondaryColor }}
                />
              </div>
            </Card>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Aprovações de Usuários</h2>
        
        <div>
          <h3 className="text-lg font-semibold mb-3 text-yellow-600">Pendentes ({pendingUsers.length})</h3>
          {pendingUsers.length === 0 ? (
            <p className="text-muted-foreground">Nenhuma aprovação pendente</p>
          ) : (
            <div className="space-y-3">
              {pendingUsers.map((approval) => (
                <Card key={approval.id} className="p-4 bg-yellow-50 dark:bg-yellow-950">
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
                    Status: Aprovado
                  </p>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

interface Gym {
  id: number;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  partnershipType?: string;
}

export function GymManagement() {
  const { toast } = useToast();
  const [isAddingGym, setIsAddingGym] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    primaryColor: "#0066FF",
    secondaryColor: "#FF0000",
    partnershipType: "",
  });

  const { data: gyms, isLoading } = useQuery<Gym[]>({
    queryKey: ["/api/admin/gyms"],
  });

  const addGymMutation = useMutation({
    mutationFn: (newGym: typeof formData) =>
      apiRequest("POST", "/api/admin/gyms", newGym),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/gyms"] });
      setFormData({
        name: "",
        primaryColor: "#0066FF",
        secondaryColor: "#FF0000",
        partnershipType: "",
      });
      setIsAddingGym(false);
      toast({
        title: "Success",
        description: "Gym added successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add gym",
        variant: "destructive",
      });
    },
  });

  const deleteGymMutation = useMutation({
    mutationFn: (gymId: number) =>
      apiRequest("DELETE", `/api/admin/gyms/${gymId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/gyms"] });
      toast({
        title: "Success",
        description: "Gym deleted successfully",
      });
    },
  });

  if (isLoading) {
    return <div>Loading gyms...</div>;
  }

  return (
    <div className="space-y-4">
      {!isAddingGym ? (
        <Button onClick={() => setIsAddingGym(true)} data-testid="button-add-gym">
          Add New Gym
        </Button>
      ) : (
        <Card className="p-6 space-y-4">
          <h3 className="font-semibold">Add New Gym</h3>
          <Input
            placeholder="Gym Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            data-testid="input-gym-name"
          />
          <div className="flex gap-4">
            <div>
              <label className="block text-sm mb-2">Primary Color</label>
              <input
                type="color"
                value={formData.primaryColor}
                onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                data-testid="input-primary-color"
              />
            </div>
            <div>
              <label className="block text-sm mb-2">Secondary Color</label>
              <input
                type="color"
                value={formData.secondaryColor}
                onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                data-testid="input-secondary-color"
              />
            </div>
          </div>
          <Input
            placeholder="Partnership Type (e.g., Premium, Basic)"
            value={formData.partnershipType}
            onChange={(e) => setFormData({ ...formData, partnershipType: e.target.value })}
            data-testid="input-partnership-type"
          />
          <div className="flex gap-2">
            <Button
              onClick={() => addGymMutation.mutate(formData)}
              disabled={addGymMutation.isPending || !formData.name}
              data-testid="button-save-gym"
            >
              Save
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsAddingGym(false)}
              data-testid="button-cancel-add"
            >
              Cancel
            </Button>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {gyms?.map((gym) => (
          <Card key={gym.id} className="p-4 space-y-3" data-testid={`card-gym-${gym.id}`}>
            <h3 className="font-semibold">{gym.name}</h3>
            <div className="flex gap-2">
              <div
                className="w-8 h-8 rounded border"
                style={{ backgroundColor: gym.primaryColor }}
              />
              <div
                className="w-8 h-8 rounded border"
                style={{ backgroundColor: gym.secondaryColor }}
              />
            </div>
            {gym.partnershipType && (
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {gym.partnershipType}
              </p>
            )}
            <Button
              variant="destructive"
              size="sm"
              onClick={() => deleteGymMutation.mutate(gym.id)}
              disabled={deleteGymMutation.isPending}
              data-testid={`button-delete-gym-${gym.id}`}
            >
              Delete
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}

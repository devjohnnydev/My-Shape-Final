import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";

export function useWorkouts() {
  return useQuery({
    queryKey: [api.workouts.list.path],
    queryFn: async () => {
      const res = await fetch(api.workouts.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Falha ao buscar treinos");
      return api.workouts.list.responses[200].parse(await res.json());
    },
  });
}

export function useGenerateWorkout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { muscleGroup: string }) => {
      const res = await fetch(api.workouts.generate.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!res.ok) {
        if (res.status === 402) throw new Error("Pagamento necessário para gerar mais treinos.");
        if (res.status === 400) throw new Error("Dados de requisição inválidos.");
        throw new Error("Falha ao gerar treino");
      }
      return api.workouts.generate.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.workouts.list.path] });
    },
  });
}

export function useCompleteWorkout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.workouts.complete.path, { id });
      const res = await fetch(url, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Falha ao concluir treino");
      return api.workouts.complete.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.workouts.list.path] });
    },
  });
}

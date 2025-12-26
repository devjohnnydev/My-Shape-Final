import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { type InsertUserSettings } from "@shared/schema";

export function useUserSettings() {
  return useQuery({
    queryKey: [api.user.getSettings.path],
    queryFn: async () => {
      const res = await fetch(api.user.getSettings.path, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch settings");
      return api.user.getSettings.responses[200].parse(await res.json());
    },
  });
}

export function useUpdateUserSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertUserSettings) => {
      const validated = api.user.updateSettings.input.parse(data);
      const res = await fetch(api.user.updateSettings.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) {
        if (res.status === 400) {
          const error = api.user.updateSettings.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Failed to update settings");
      }
      return api.user.updateSettings.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.user.getSettings.path] });
    },
  });
}

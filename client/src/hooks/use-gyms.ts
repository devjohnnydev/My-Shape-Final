import { useQuery } from "@tanstack/react-query";

export interface Gym {
  id: number;
  name: string;
  logo?: string;
  primaryColor: string;
  secondaryColor: string;
  description?: string;
  createdAt: string;
}

export function useGyms() {
  return useQuery<Gym[]>({
    queryKey: ["/api/gyms"],
    queryFn: async () => {
      const res = await fetch("/api/gyms", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch gyms");
      return res.json();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

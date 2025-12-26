import { useMutation } from "@tanstack/react-query";
import { api } from "@shared/routes";

export function useAskQuestion() {
  return useMutation({
    mutationFn: async (data: { question: string }) => {
      const res = await fetch(api.qa.ask.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!res.ok) {
        if (res.status === 400) throw new Error("Pergunta inválida.");
        throw new Error("Falha ao processar pergunta");
      }
      return api.qa.ask.responses[200].parse(await res.json());
    },
  });
}

import { Layout } from "@/components/layout/Layout";
import { useAskQuestion } from "@/hooks/use-qa";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, Send, Lightbulb } from "lucide-react";
import { useState } from "react";

export default function QAPage() {
  const [questions, setQuestions] = useState<Array<{ q: string; a: string }>>([]);
  const [input, setInput] = useState("");
  const { mutate: askQuestion, isPending } = useAskQuestion();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const question = input;
    setInput("");
    setQuestions(prev => [...prev, { q: question, a: "" }]);

    askQuestion(
      { question },
      {
        onSuccess: (data) => {
          setQuestions(prev => {
            const updated = [...prev];
            updated[updated.length - 1].a = data.answer;
            return updated;
          });
        },
        onError: () => {
          setQuestions(prev => {
            const updated = [...prev];
            updated[updated.length - 1].a = "Erro ao processar pergunta. Tente novamente.";
            return updated;
          });
        },
      }
    );
  };

  return (
    <Layout>
      <div className="space-y-6 animate-in pb-24">
        <div>
          <h1 className="text-3xl font-bold">Dúvidas Sobre Academia</h1>
          <p className="text-muted-foreground">Faça perguntas sobre ganho de massa, perda de peso e definição muscular</p>
        </div>

        <div className="space-y-4">
          {questions.length === 0 && (
            <Card className="p-8 text-center border-dashed">
              <Lightbulb className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Faça uma pergunta para começar!</p>
              <p className="text-sm text-muted-foreground mt-2">Exemplos: "Como ganhar massa muscular rapidamente?", "Qual a melhor dieta para perder peso?", "Como definir os músculos?"</p>
            </Card>
          )}

          {questions.map((item, idx) => (
            <div key={idx} className="space-y-3">
              <div className="bg-primary/10 p-4 rounded-xl">
                <p className="font-semibold text-sm">{item.q}</p>
              </div>
              
              {item.a ? (
                <Card className="p-4 bg-muted/50">
                  <p className="text-sm whitespace-pre-wrap">{item.a}</p>
                </Card>
              ) : (
                <Card className="p-4 flex items-center gap-2 justify-center min-h-[80px]">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">Processando resposta...</span>
                </Card>
              )}
            </div>
          ))}
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="flex gap-2 sticky bottom-24 md:bottom-0">
          <Input
            placeholder="Faça uma pergunta sobre academia..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isPending}
            className="flex-1"
            data-testid="input-question"
          />
          <Button 
            type="submit" 
            size="icon"
            disabled={isPending || !input.trim()}
            data-testid="button-send-question"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>
    </Layout>
  );
}

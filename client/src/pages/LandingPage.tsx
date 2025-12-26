import { Button } from "@/components/ui/button";
import { Dumbbell, ArrowRight } from "lucide-react";
import { Link } from "wouter";

export default function LandingPage() {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-background overflow-hidden">
      {/* Background Gradient Mesh */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/20 blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-4xl px-4 text-center space-y-8">
        <div className="flex justify-center mb-6">
          <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 shadow-xl shadow-primary/10 rotate-3">
            <Dumbbell className="w-12 h-12 text-primary" />
          </div>
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-foreground">
          My<span className="text-primary">Shape</span>
        </h1>
        
        <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          O seu companheiro inteligente de treino que se adapta à sua academia, seus objetivos e seu estilo de vida.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
          <Button 
            size="lg" 
            className="w-full sm:w-auto px-8 h-14 text-lg rounded-full shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all hover:-translate-y-1"
            asChild
          >
            <a href="/api/login">
              Começar Gratuitamente <ArrowRight className="ml-2 w-5 h-5" />
            </a>
          </Button>
          
          <Button 
            variant="outline" 
            size="lg"
            className="w-full sm:w-auto px-8 h-14 text-lg rounded-full border-2"
          >
            Como funciona
          </Button>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-16 text-left">
          <FeatureCard 
            title="Adaptado à Sua Academia" 
            desc="Treinos personalizados para o equipamento disponível na sua academia."
          />
          <FeatureCard 
            title="Alimentado por IA" 
            desc="Algoritmos inteligentes geram a rotina perfeita para seus grupos musculares."
          />
          <FeatureCard 
            title="Acompanhamento de Progresso" 
            desc="Visualize seus ganhos e consistência com gráficos bonitos."
          />
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="p-6 rounded-2xl bg-card/50 border border-border/50 backdrop-blur-sm">
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}

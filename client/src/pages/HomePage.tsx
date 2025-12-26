import { Layout } from "@/components/layout/Layout";
import { useUserSettings, useUpdateUserSettings } from "@/hooks/use-user-settings";
import { useWorkouts, useGenerateWorkout } from "@/hooks/use-workouts";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, Zap, Trophy, MapPin, Calendar, ArrowRight, Dumbbell } from "lucide-react";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";

export default function HomePage() {
  const { data: settings, isLoading: loadingSettings } = useUserSettings();
  const { mutate: updateSettings } = useUpdateUserSettings();
  const { data: workouts, isLoading: loadingWorkouts } = useWorkouts();
  const { mutate: generateWorkout, isPending: isGenerating } = useGenerateWorkout();
  
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [, setLocation] = useLocation();
  const [quoteIndex, setQuoteIndex] = useState(0);

  // Motivational quotes while loading
  const loadingQuotes = [
    "Construindo seu plano personalizado...",
    "Consultando os oráculos do fitness...",
    "Calibrando pesos para ganhos máximos...",
    "Analisando equipamentos da academia..."
  ];

  useEffect(() => {
    if (isGenerating && quoteIndex < loadingQuotes.length - 1) {
      const timer = setTimeout(() => setQuoteIndex(prev => (prev + 1) % loadingQuotes.length), 3000);
      return () => clearTimeout(timer);
    }
  }, [isGenerating, quoteIndex, loadingQuotes.length]);

  if (loadingSettings) {
    return (
      <Layout hideNav>
        <div className="flex h-[80vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  // If no settings found, show onboarding
  if (!settings) {
    return (
      <Layout hideNav>
        <OnboardingWizard />
      </Layout>
    );
  }

  const handleGenerate = (muscleGroup: string) => {
    generateWorkout({ muscleGroup }, {
      onSuccess: () => {
        setIsGenerateOpen(false);
        setLocation("/workouts"); // Redirect to workouts list
      }
    });
  };

  const completedWorkouts = workouts?.filter(w => w.completed).length || 0;

  return (
    <Layout>
      <div className="space-y-8 animate-in pb-24">
        
        {/* Header Section */}
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Painel de Controle</h1>
            <p className="text-muted-foreground">Bem-vindo, vamos conquista.</p>
          </div>
          
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            <Select 
              value={settings.currentLocation} 
              onValueChange={(val) => updateSettings({ 
                userId: settings.userId,
                goal: settings.goal,
                timeAvailable: settings.timeAvailable,
                frequency: settings.frequency,
                currentLocation: val,
                subscriptionStatus: settings.subscriptionStatus
              })}
            >
              <SelectTrigger className="w-[180px] bg-card/50 backdrop-blur-sm">
                <SelectValue placeholder="Selecione Academia" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="skyfit">SkyFit</SelectItem>
                <SelectItem value="smartfit">Smart Fit</SelectItem>
                <SelectItem value="gavioes">Gaviões</SelectItem>
                <SelectItem value="home">Academia em Casa</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-full bg-primary/20">
                <Trophy className="h-5 w-5 text-primary" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">Completados</span>
            </div>
            <p className="text-3xl font-bold">{completedWorkouts}</p>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-full bg-secondary">
                <Calendar className="h-5 w-5 text-foreground" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">Frequência</span>
            </div>
            <p className="text-3xl font-bold">{settings.frequency}<span className="text-sm font-normal text-muted-foreground ml-1">x/semana</span></p>
          </Card>
        </div>

        {/* Main Action */}
        <div className="relative overflow-hidden rounded-3xl bg-primary p-8 text-primary-foreground shadow-2xl shadow-primary/25">
          <div className="relative z-10">
            <h2 className="text-2xl font-bold mb-2">Pronto para treinar?</h2>
            <p className="text-primary-foreground/80 mb-6 max-w-xs">
              Gere um treino personalizado baseado na sua localização atual e objetivos.
            </p>
            <Button 
              size="lg" 
              variant="secondary"
              className="font-semibold shadow-lg hover:shadow-xl transition-all"
              onClick={() => setIsGenerateOpen(true)}
            >
              <Zap className="mr-2 h-4 w-4" /> Iniciar Treino
            </Button>
          </div>
          
          {/* Decorative background circle */}
          <div className="absolute -right-12 -bottom-12 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        </div>

        {/* Recent Workouts */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold">Histórico Recente</h3>
            <Button variant="ghost" size="sm" asChild>
              <a href="/workouts">Ver Todos</a>
            </Button>
          </div>
          
          <div className="space-y-3">
            {loadingWorkouts ? (
              Array(3).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-xl" />
              ))
            ) : workouts?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum treino ainda. Comece um hoje!
              </div>
            ) : (
              workouts?.slice(0, 3).map((workout) => (
                <Card key={workout.id} className="p-4 flex items-center justify-between hover:border-primary/50 transition-colors">
                  <div>
                    <h4 className="font-semibold capitalize">{workout.muscleGroup}</h4>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(workout.date), "dd/MM/yyyy")} • {workout.completed ? "Concluído" : "Em Andamento"}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" asChild>
                    <a href={`/workouts?id=${workout.id}`}>
                      <ArrowRight className="h-4 w-4" />
                    </a>
                  </Button>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Workout Generation Dialog */}
      <Dialog open={isGenerateOpen} onOpenChange={setIsGenerateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Iniciar Treino</DialogTitle>
            <DialogDescription>
              Escolha um grupo muscular para focar hoje.
            </DialogDescription>
          </DialogHeader>
          
          {isGenerating ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl animate-pulse" />
                <Loader2 className="h-12 w-12 animate-spin text-primary relative z-10" />
              </div>
              <p className="text-lg font-medium animate-pulse">{loadingQuotes[quoteIndex]}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 py-4">
              {['Peito', 'Costas', 'Pernas', 'Ombros', 'Braços', 'Core'].map((group) => (
                <Button 
                  key={group} 
                  variant="outline" 
                  className="h-24 flex flex-col items-center justify-center gap-2 hover:border-primary hover:bg-primary/5 transition-all"
                  onClick={() => handleGenerate(group)}
                >
                  <Dumbbell className="h-6 w-6 opacity-50" />
                  {group}
                </Button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
}

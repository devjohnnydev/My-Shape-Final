import { Layout } from "@/components/layout/Layout";
import { useWorkouts, useCompleteWorkout } from "@/hooks/use-workouts";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, CheckCircle2, Clock } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import type { WorkoutPlan, Exercise } from "@shared/schema";
import { cn } from "@/lib/utils";

export default function WorkoutsPage() {
  const { data: workouts, isLoading } = useWorkouts();
  const { mutate: completeWorkout, isPending: isCompleting } = useCompleteWorkout();
  
  // Simplified state to track active workout view
  const [expandedId, setExpandedId] = useState<number | null>(null);

  if (isLoading) {
    return (
      <Layout>
        <div className="flex h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  const sortedWorkouts = workouts?.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <Layout>
      <div className="space-y-6 animate-in">
        <h1 className="text-3xl font-bold">Seus Treinos</h1>
        
        <div className="space-y-4">
          {sortedWorkouts?.map((workout) => {
            const plan = workout.plan as unknown as WorkoutPlan;
            const isExpanded = expandedId === workout.id || (!workout.completed && expandedId === null);
            
            // Only auto-expand the first incomplete one if no explicit selection
            if (!workout.completed && expandedId === null) {
               // This is a render side-effect but safe enough for this simple logic
               // better would be useEffect but let's keep it simple
            }

            return (
              <Card 
                key={workout.id} 
                className={cn(
                  "overflow-hidden transition-all duration-300 border-2",
                  isExpanded ? "border-primary/50 shadow-lg ring-1 ring-primary/20" : "border-border"
                )}
              >
                <div 
                  className="p-4 flex items-center justify-between cursor-pointer bg-card hover:bg-muted/50 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : workout.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "p-3 rounded-full",
                      workout.completed ? "bg-green-100 text-green-600" : "bg-primary/10 text-primary"
                    )}>
                      {workout.completed ? <CheckCircle2 className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                    </div>
                    <div>
                      <h3 className="font-bold capitalize text-lg">Dia de {workout.muscleGroup}</h3>
                      <p className="text-sm text-muted-foreground">{workout.date ? format(new Date(workout.date), "dd/MM/yyyy") : "Data indisponível"}</p>
                    </div>
                  </div>
                  <Badge variant={workout.completed ? "default" : "outline"}>
                    {workout.completed ? "Concluído" : "Ativo"}
                  </Badge>
                </div>

                {isExpanded && (
                  <div className="p-4 border-t bg-muted/10 animate-in">
                    <div className="space-y-4">
                      {plan.map((exercise: Exercise, idx: number) => (
                        <div key={idx} className="flex items-start gap-4 p-3 rounded-lg bg-background border border-border/50">
                          <Checkbox id={`ex-${workout.id}-${idx}`} className="mt-1" />
                          <div className="space-y-1">
                            <label 
                              htmlFor={`ex-${workout.id}-${idx}`}
                              className="font-semibold text-base leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {exercise.name}
                            </label>
                            <div className="text-sm text-muted-foreground flex gap-3">
                              <span className="bg-primary/10 px-2 py-0.5 rounded text-primary font-medium">{exercise.sets} séries</span>
                              <span>{exercise.reps} repetições</span>
                              <span>{exercise.rest}s descanso</span>
                            </div>
                            {exercise.notes && (
                              <p className="text-xs text-muted-foreground italic mt-1">{exercise.notes}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {!workout.completed && (
                      <div className="mt-6 flex justify-end">
                        <Button 
                          size="lg"
                          onClick={(e) => {
                            e.stopPropagation();
                            completeWorkout(workout.id);
                          }}
                          disabled={isCompleting}
                          className="w-full sm:w-auto"
                        >
                          {isCompleting ? (
                            <>Finalizando <Loader2 className="ml-2 h-4 w-4 animate-spin" /></>
                          ) : (
                            "Concluir Treino"
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
          
          {sortedWorkouts?.length === 0 && (
            <div className="text-center py-12 text-muted-foreground bg-card rounded-2xl border border-dashed">
              Nenhum treino encontrado. Vá ao Painel de Controle para começar um!
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

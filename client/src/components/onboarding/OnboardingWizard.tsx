import { useState } from "react";
import { useUpdateUserSettings } from "@/hooks/use-user-settings";
import { useGyms } from "@/hooks/use-gyms";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, ArrowRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: 'goal', title: 'Qual é seu objetivo principal?' },
  { id: 'time', title: 'Quanto tempo você tem disponível?' },
  { id: 'frequency', title: 'Com que frequência você pode treinar?' },
  { id: 'location', title: 'Onde você treina?' },
];

const DEFAULT_GYMS = [
  { id: 1, name: 'SkyFit', primaryColor: '#1E40AF', secondaryColor: '#3B82F6' },
  { id: 2, name: 'Smart Fit', primaryColor: '#DC2626', secondaryColor: '#EF4444' },
  { id: 3, name: 'Gaviões', primaryColor: '#7C3AED', secondaryColor: '#A78BFA' },
  { id: 4, name: 'Academia em Casa', primaryColor: '#059669', secondaryColor: '#10B981' },
];

export function OnboardingWizard() {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({
    goal: '',
    timeAvailable: 60,
    frequency: 3,
    currentLocation: String(DEFAULT_GYMS[0].id),
  });
  
  const { mutate, isPending } = useUpdateUserSettings();
  const { data: gyms = DEFAULT_GYMS } = useGyms();

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(s => s + 1);
    } else {
      const payload = {
        userId: 'auto-set-by-server',
        goal: formData.goal,
        timeAvailable: formData.timeAvailable,
        frequency: formData.frequency,
        currentLocation: formData.currentLocation,
        subscriptionStatus: 'free',
      };
      console.log('Sending payload:', payload);
      mutate(payload as any);
    }
  };

  const isStepValid = () => {
    switch(step) {
      case 0: return !!formData.goal;
      case 1: return !!formData.timeAvailable;
      case 2: return !!formData.frequency;
      case 3: return !!formData.currentLocation;
      default: return true;
    }
  };

  const currentStep = STEPS[step];

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] w-full max-w-md mx-auto animate-in">
      <div className="w-full space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-primary">Configure Seu Plano</h1>
          <p className="text-muted-foreground">Passo {step + 1} de {STEPS.length}</p>
        </div>

        <Card className="p-6 border-2 border-border/50 shadow-xl">
          <h2 className="text-xl font-semibold mb-6">{currentStep.title}</h2>
          
          <div className="space-y-4">
            {step === 0 && (
              <div className="grid gap-3">
                {[
                  { value: 'muscle_gain', label: 'Ganho de Massa' },
                  { value: 'weight_loss', label: 'Perda de Peso' },
                  { value: 'definition', label: 'Definição' }
                ].map((goal) => (
                  <OptionButton 
                    key={goal.value}
                    selected={formData.goal === goal.value}
                    onClick={() => setFormData({ ...formData, goal: goal.value })}
                    label={goal.label}
                  />
                ))}
              </div>
            )}

            {step === 1 && (
              <div className="grid gap-3">
                {[30, 45, 60, 90].map((mins) => (
                  <OptionButton 
                    key={mins}
                    selected={formData.timeAvailable === mins}
                    onClick={() => setFormData({ ...formData, timeAvailable: mins })}
                    label={`${mins} Minutos`}
                  />
                ))}
              </div>
            )}

            {step === 2 && (
              <div className="grid grid-cols-4 gap-3">
                {[1, 2, 3, 4, 5, 6, 7].map((days) => (
                  <OptionButton 
                    key={days}
                    selected={formData.frequency === days}
                    onClick={() => setFormData({ ...formData, frequency: days })}
                    label={`${days}`}
                    className="text-center justify-center"
                  />
                ))}
              </div>
            )}

            {step === 3 && (
              <div className="grid gap-3">
                {gyms.map((gym) => (
                  <OptionButton 
                    key={gym.id}
                    selected={formData.currentLocation === String(gym.id)}
                    onClick={() => setFormData({ ...formData, currentLocation: String(gym.id) })}
                    label={gym.name}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="mt-8 flex justify-end">
            <Button 
              onClick={handleNext} 
              disabled={isPending || !isStepValid()}
              className="w-full sm:w-auto"
              size="lg"
              data-testid="button-next-step"
            >
              {isPending ? (
                <>Salvando <Loader2 className="ml-2 h-4 w-4 animate-spin" /></>
              ) : (
                <>Próximo Passo <ArrowRight className="ml-2 h-4 w-4" /></>
              )}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

function OptionButton({ selected, onClick, label, className }: { selected: boolean; onClick: () => void; label: string; className?: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center justify-between w-full px-4 py-3 text-sm font-medium rounded-xl border-2 transition-all duration-200",
        selected 
          ? "border-primary bg-primary/5 text-primary shadow-sm" 
          : "border-border bg-card hover:bg-muted hover:border-primary/30",
        className
      )}
    >
      {label}
      {selected && <Check className="h-4 w-4 text-primary" />}
    </button>
  );
}

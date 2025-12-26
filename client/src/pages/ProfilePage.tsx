import { Layout } from "@/components/layout/Layout";
import { useUserSettings } from "@/hooks/use-user-settings";
import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useWorkouts } from "@/hooks/use-workouts";
import { Loader2 } from "lucide-react";

export default function ProfilePage() {
  const { data: settings, isLoading } = useUserSettings();
  const { data: workouts } = useWorkouts();

  // Mock data for the chart based on workouts history
  const chartData = [
    { name: 'Mon', workouts: 1 },
    { name: 'Tue', workouts: 0 },
    { name: 'Wed', workouts: 1 },
    { name: 'Thu', workouts: 1 },
    { name: 'Fri', workouts: 0 },
    { name: 'Sat', workouts: 1 },
    { name: 'Sun', workouts: 0 },
  ];

  if (isLoading) return <Layout><Loader2 className="animate-spin mx-auto mt-20" /></Layout>;

  return (
    <Layout>
      <div className="space-y-8 animate-in pb-20">
        <h1 className="text-3xl font-bold">Seu Progresso</h1>

        <div className="grid gap-6">
          <Card className="p-6">
            <h3 className="font-semibold mb-6">Consistência Semanal</h3>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} />
                  <YAxis axisLine={false} tickLine={false} fontSize={12} hide />
                  <Tooltip 
                    cursor={{fill: 'var(--muted)'}}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="workouts" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <div className="grid grid-cols-2 gap-4">
            <StatsCard label="Objetivo" value={settings?.goal?.replace('_', ' ').toUpperCase() || '-'} />
            <StatsCard label="Tempo/Sessão" value={`${settings?.timeAvailable}m`} />
          </div>

          <Card className="p-6 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white border-none shadow-lg">
            <h3 className="font-bold text-xl mb-2">Plano Premium</h3>
            <p className="opacity-90 mb-4">Desbloqueie análises avançadas e geração ilimitada de IA.</p>
            <button className="px-4 py-2 bg-white text-violet-600 rounded-lg font-bold text-sm hover:bg-white/90 transition-colors">
              Fazer Upgrade
            </button>
          </Card>
        </div>
      </div>
    </Layout>
  );
}

function StatsCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-4">
      <p className="text-sm text-muted-foreground font-medium mb-1">{label}</p>
      <p className="text-2xl font-bold truncate">{value}</p>
    </Card>
  );
}

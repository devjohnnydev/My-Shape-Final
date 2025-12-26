import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LogOut, User, Crown, Moon } from "lucide-react";
import { useUpdateUserSettings, useUserSettings } from "@/hooks/use-user-settings";

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { data: settings } = useUserSettings();
  const { mutate: updateSettings } = useUpdateUserSettings();
  const { theme } = useTheme(); // just to access theme if needed

  return (
    <Layout>
      <div className="space-y-6 animate-in">
        <h1 className="text-3xl font-bold">Configurações</h1>

        <div className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-border shadow-sm">
          <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center text-primary">
            {user?.profileImageUrl ? (
              <img src={user.profileImageUrl} alt="Perfil" className="h-16 w-16 rounded-full object-cover" />
            ) : (
              <User className="h-8 w-8" />
            )}
          </div>
          <div>
            <h2 className="text-xl font-bold">{user?.firstName} {user?.lastName}</h2>
            <p className="text-muted-foreground text-sm">{user?.email}</p>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold px-1">Preferências</h3>
          
          <Card className="divide-y divide-border">
            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="font-medium">Academia Atual</p>
                <p className="text-sm text-muted-foreground capitalize">{settings?.currentLocation}</p>
              </div>
              <Button variant="outline" size="sm" asChild>
                <a href="/">Alterar</a>
              </Button>
            </div>
            
            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="font-medium">Assinatura</p>
                <p className="text-sm text-muted-foreground capitalize">Plano {settings?.subscriptionStatus}</p>
              </div>
              <Button variant="outline" size="sm" className="text-amber-500 border-amber-200 hover:bg-amber-50">
                <Crown className="mr-2 h-4 w-4" /> Fazer Upgrade
              </Button>
            </div>
          </Card>
        </div>

        <Button 
          variant="destructive" 
          className="w-full h-12 text-lg" 
          onClick={() => logout()}
        >
          <LogOut className="mr-2 h-5 w-5" /> Sair
        </Button>
        
        <div className="text-center text-xs text-muted-foreground mt-8">
          My Shape App v1.0.0
        </div>
      </div>
    </Layout>
  );
}

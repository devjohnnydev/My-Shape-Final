import { Link, useLocation } from "wouter";
import { Home, User, Dumbbell, Settings, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function Navbar() {
  const [location] = useLocation();

  const navItems = [
    { href: "/", icon: Home, label: "Início" },
    { href: "/workouts", icon: Dumbbell, label: "Treinos" },
    { href: "/qa", icon: HelpCircle, label: "Dúvidas" },
    { href: "/profile", icon: User, label: "Perfil" },
    { href: "/settings", icon: Settings, label: "Configurações" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/80 backdrop-blur-lg pb-safe md:top-0 md:bottom-auto md:border-b md:border-t-0">
      <div className="mx-auto flex h-16 max-w-lg items-center justify-around px-4 md:max-w-7xl md:justify-end md:gap-8">
        <div className="hidden md:mr-auto md:block">
           <span className="text-xl font-bold tracking-tighter text-foreground">
             My<span className="text-primary">Shape</span>
           </span>
        </div>
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = location === href;
          return (
            <Link key={href} href={href} className={cn(
                "flex flex-col items-center justify-center gap-1 rounded-lg p-2 text-xs font-medium transition-colors md:flex-row md:text-sm md:px-4 md:py-2",
                isActive 
                  ? "text-primary bg-primary/10" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <Icon className={cn("h-5 w-5 md:h-4 md:w-4", isActive && "stroke-primary")} />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

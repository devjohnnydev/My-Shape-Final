import { ReactNode } from "react";
import { Navbar } from "./Navbar";
import { useTheme } from "@/hooks/use-theme";

interface LayoutProps {
  children: ReactNode;
  hideNav?: boolean;
}

export function Layout({ children, hideNav = false }: LayoutProps) {
  // Initialize theme effect
  useTheme();

  return (
    <div className="min-h-screen w-full bg-background pb-20 pt-safe md:pb-0 md:pt-20">
      {!hideNav && <Navbar />}
      <main className="container mx-auto px-4 py-6 sm:px-6 lg:px-8 max-w-3xl">
        {children}
      </main>
    </div>
  );
}

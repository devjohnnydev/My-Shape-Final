import React, { createContext, useContext } from "react";

interface Gym {
  id: number;
  name: string;
  primaryColor: string;
  secondaryColor: string;
}

interface ThemeContextType {
  currentGym: Gym | null;
  setCurrentGym: (gym: Gym | null) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [currentGym, setCurrentGym] = React.useState<Gym | null>(null);

  React.useEffect(() => {
    // Apply gym colors to document root when gym changes
    if (currentGym) {
      const root = document.documentElement;
      root.style.setProperty("--primary", currentGym.primaryColor);
      root.style.setProperty("--secondary", currentGym.secondaryColor);
    }
  }, [currentGym]);

  return (
    <ThemeContext.Provider value={{ currentGym, setCurrentGym }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}

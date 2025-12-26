import { useEffect, useState } from "react";
import { useUserSettings } from "./use-user-settings";

export function useTheme() {
  const { data: settings } = useUserSettings();
  const [theme, setTheme] = useState("home");

  useEffect(() => {
    if (settings?.currentLocation) {
      setTheme(settings.currentLocation);
    }
  }, [settings]);

  // Apply theme to document root or a wrapper
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  return { theme };
}

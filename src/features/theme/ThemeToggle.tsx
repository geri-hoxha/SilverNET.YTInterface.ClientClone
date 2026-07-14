import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useTheme } from "./theme-provider";

function ThemeToggle() {
  const { isLightMode, setTheme } = useTheme();

  const handleToggle = () => {
    setTheme(isLightMode ? "dark" : "light");
  };

  return (
    <Button variant="ghost" size="icon" className="text-muted-foreground relative h-8 w-8" onClick={handleToggle}>
      <Sun className={`absolute h-4 w-4 transition-all duration-300 ease-in-out ${isLightMode ? "blur-0 scale-100 rotate-0 opacity-100" : "scale-0 -rotate-180 opacity-0 blur-xs"}`} />
      <Moon className={`absolute h-4 w-4 transition-all duration-300 ease-in-out ${isLightMode ? "scale-0 -rotate-180 opacity-0 blur-xs" : "blur-0 scale-100 rotate-0 opacity-100"}`} />
    </Button>
  );
}

export default ThemeToggle;
